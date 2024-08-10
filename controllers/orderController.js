const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');

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


// create new order
exports.createNewOrder = catchAsyncError(async (req, res, next) => {
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
  const orderId = await generateOrderId();
  const order = await Order.create({
    orderId,
    shippingInfo,
    orderItems,
    user,
    paymentInfo,
    paidAt: paidAt || Date.now(),  
    itemsPrice,
    discountPrice,
    shippingPrice,
    totalPrice,
    orderStatus,
    deliverAt
  });
  res.status(200).json({
    success: true,
    data: order,
  });
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
  const {userId} = req.params;
  if (!userId) {
    return next(new ErrorHandler('Order not found', 400));
  }
   const order = await Order.find({ 'user.userId': userId });
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
  const orders = await Order.find();
  res.status(200).json({
    success: true,
    data: orders,
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
