const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = 'AIzaSyChe49SyZJZYPXiyZEey4mvgqxO1lagIqQ';

const getLatLng = async (toCheckAddress) => {
  const { address, city, pin_code, state, landmark, locality } = toCheckAddress;
  if (!address || !city || !pin_code || !state) {
    return res.status(400).json({ success: false, message: 'Incomplete address information' });
  }
  const constructedAddress = `${address}, ${locality || ''}, ${city}, ${state}, ${pin_code}`;
  console.log(constructedAddress);

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: constructedAddress,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    console.log(response);
    const results = response.data.results;
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Extract latitude and longitude from the response
    const location = results[0].geometry.location;
    const { lat, lng } = location;

    res.json({
      success: true,
      latitude: lat,
      longitude: lng
    });
  } catch (error) {
    console.log('Error occured while get lat lng', error);
    throw new ErrorHandler('Unable to get lat lng');
  }
};

const generateOrderId = async () => {
  try {
    // Find the most recent order
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });

    // If no previous order is found, return the first orderId
    if (!lastOrder || !lastOrder.orderId) {
      return 'ORD1';
    }

    // Extract the numeric part from the last orderId
    const lastOrderIdNumber = parseInt(lastOrder.orderId.replace('ORD', ''), 10);

    // If extraction fails, start with ORD1
    if (isNaN(lastOrderIdNumber)) {
      return 'ORD1';
    }

    // Increment the numeric part for the new orderId
    return `ORD${lastOrderIdNumber + 1}`;
  } catch (error) {
    console.error('Error generating orderId:', error);
    throw new ErrorHandler('Unable to generate orderId', 500);
  }
};


exports.createNewOrder = catchAsyncError(async ( req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    user,
    paymentInfo,
    paidAt,
    itemsPrice,
    discountPrice,
    shippingPrice,
    totalPrice,
    orderStatus,
    deliverAt
  } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    for(let item of orderItems) {
      const product = await Product.findById(item.id).session(session);
      const subSession = await mongoose.startSession();
      subSession.startTransaction();
      try {
        if(parseInt(product.stock) < parseInt(item.quantity)) {
          throw new ErrorHandler(`Not enough stock for product ${product.name}`);
        }
        product.stock -= item.quantity;
        await product.save({subSession});
      } catch (error) {
        await subSession.abortTransaction();
        console.error(error.message);
      }
    }

    const newOrder = new Order({
      shippingInfo,
      orderItems,
      user,
      paymentInfo,
      paidAt,
      itemsPrice,
      discountPrice,
      shippingPrice,
      totalPrice,
      orderStatus,
      deliverAt    
    });

    const result = await newOrder.save({session});
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      success: true,
      message: 'new order created successfully',
      data: newOrder
    });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
  }
});

// send single order
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Order not found', 400));
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler('Order not found', 200));
  }
  res.status(200).json({
    success: true,
    data: order,
  });
});

// send user orders
exports.getUserOrders = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  if (!userId) {
    return next(new ErrorHandler('Order not found', 400));
  }
  const order = await Order.aggregate([
    { $match: { 'user.userId': mongoose.Types.ObjectId(userId) } }, // Match the user's orders
    {
      $project: {
        orderItems: { $sortArray: { input: "$orderItems", sortBy: { name: 1 } } }, // Sort orderItems alphabetically by name
        shippingInfo: 1,
        user: 1,
        paymentInfo: 1,
        paidAt: 1,
        itemsPrice: 1,
        discountPrice: 1,
        shippingPrice: 1,
        totalPrice: 1,
        orderStatus: 1,
        deliverAt: 1,
        createdAt: 1,
        updatedAt: 1,
        id: 1,
      }
    },
    { $sort: { createdAt: -1 } } // Sort orders by date (descending order)
  ]);
  if (!order) {
    return next(new ErrorHandler('Order not found', 200));
  }
  res.status(200).json({
    success: true,
    data: order,
  });
});

// send all orders
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const orders = await Order.aggregate([
    {
      $project: {
        orderId: 1,
        orderItems: {
          $map: {
            input: "$orderItems",
            as: "item",
            in: {
              name: "$$item.name",
              price: "$$item.price",
              image: "$$item.image"
            }
          }
        },
        user: {
          name: 1,
        },
        paymentInfo: {
          status: 1,
        },
        totalPrice: 1,
        orderStatus: 1,
        createdAt: 1,
      }
    },
    {$sort: {createAt: 1}},
    {$skip: skip},
    {$limit: limit}
  ]);
  if(!orders) {
    return next(new ErrorHandler('No order found', 400));
  }
  const totalOrders = await Order.countDocuments();
  res.status(200).json({
    success: true, 
    page,
    limit,
    totalPages: Math.ceil(totalOrders / limit),
    totalOrders,
    data: orders
  });
});

// update order status
exports.updateOrderStatus = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Order not found', 400));
  }
  if (!req.body.status) {
    return next(new ErrorHandler('Invalid request', 400));
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler('Order not found', 200));
  }
  if (order.orderStatus === 'delivered') {
    return next(new ErrorHandler('You have already delivered this order', 400));
  }
  if (req.body.status === 'confirmed') {
    let successCount = 0;
    let failureCount = 0;
    let orderLength = order.orderItems.length;
    for (let index = 0; index < orderLength; index++) {
      const item = order.orderItems[index];
      let success = await updateStock(item.product, item.quantity);
      if (success) {
        successCount += 1;
      } else {
        failureCount += 1;
      }
    }
    if (failureCount > 0) {
      return next(new ErrorHandler('Product out of stock', 400));
    }
  }
  order.orderStatus = req.body.status;
  if (req.body.status === 'delivered') {
    order.deliveredAt = Date.now();
  }
  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
    data: order,
  });
});

// delete order
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Order not found', 400));
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler('Order not found', 200));
  }
  await order.remove();
  res.status(200).json({
    success: true,
    message: 'Order deleted',
  });
});

const updateStock = async (id, quantity) => {
  const product = await Product.findById(id);
  if (product.stock < quantity) {
    return false;
  }
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
  return true;
};

exports.getOrderByOrderId = catchAsyncError(async (req, res, next) => {
  try {
    const Id = req.params.orderId;
    const order = await Order.find({ orderId: Id });

    if (!order || order.length === 0) {
      return next(new ErrorHandler('No order found', 404));
    }
    const orderObject = order[0].toObject();
    const { orderId, ...rest } = orderObject;
    const reorderOrder = { orderId, ...rest };

    res.status(200).json({
      success: true,
      data: reorderOrder
    });
  } catch (error) {
    console.error('Server error', error);
    throw new ErrorHandler('Server error', 500);
  }

});