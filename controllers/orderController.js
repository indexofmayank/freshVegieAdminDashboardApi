const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const orderLogger = require('../loggers/orderLogger');
const axios = require('axios');
const mongoose = require('mongoose');
const { format } = require('winston');

const GOOGLE_MAPS_API_KEY = 'AIzaSyChe49SyZJZYPXiyZEey4mvgqxO1lagIqQ';

const generateOrderId = async () => {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  if (!lastOrder || !lastOrder.orderId) {
    return 'ORD1';
  }
  const lastOrderId = parseInt(lastOrder.orderId.replace('ORD', ''), 10);
  return `ORD${lastOrderId + 1}`;
};

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
    const orderId = await generateOrderId();
    const newOrder = new Order({
      orderId,
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
    orderLogger.info(`Order created: Order ID - ${result.orderId}, User ID - ${result.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'new order created successfully',
      data: newOrder
    });
  } catch (error) {
    await session.abortTransaction();
    orderLogger.error(`Error creating order: {$error.message}, User ID - ${req.body.user.uerId}`);
    console.log(error);
  }
});


// send user orders
exports.getUserOrders = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  if (!userId) {
    return next(new ErrorHandler('Order not found', 400));
  }

  try {
    const order = await Order.aggregate([
      { $match: { 'user.userId': mongoose.Types.ObjectId(userId) } }, // Match the user's orders
      {

        $project: {
          orderId: 1,
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
      { $sort: { createdAt: -1 } },
    ]);
    if (!order) {
      return next(new ErrorHandler('Order not found', 200));
    }
    const totalOrders = await Order.countDocuments();
    res.status(200).json({
      success: true,
      data: order
    });
  
  } catch (error) {
    console.error('Error while getting order: ', error);
    throw new ErrorHandler('Unable to generate orderId', 500);
  }

});

// send all orders
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const orders = await Order.aggregate([
    {
      $addFields: {
        timestampFormatted: {
          $dateToString: {
            format: "%d %B %Y, %H:%M:%S",
            date: "$createdAt",
            timezone: 'UTC'
          }
        }
      } 
    },
    {
      $project: {
        orderId: {$ifNull: ["$orderId", 'N/A']},
        timestampFormatted: {$ifNull: ["$timestampFormatted", "N/A"]},
        user: {$ifNull: ["$user.name", "N/A"]},
        totalItems: {$ifNull: [{$size: "$orderItems"}, "N/A"]},
        weight: {$ifNull: ["$total_quantity", "N/A"]},
        location: {$ifNull: ["$shippingInfo.deliveryAddress.state", "N/A"]},
        payment_status: {$ifNull: ["$paymentInfo.status", "N/A"]},
        order_status: {$ifNull: ["$orderStatus", "N/A"]},
        grand_total: {$ifNull: ["$grandTotal", "N/A"]},
        createdAt: 1
      }
    },
    {$sort: {createdAt: -1}},
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
  try {
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

    order.orderStatus = req.body.status;

    if (req.body.status === 'delivered') {
      order.deliveredAt = Date.now();
    }
    const result = await order.save({ validateBeforeSave: false });
    if(!result) {
      throw new ErrorHandler('Not able to update');
    }

    const data = await Order.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(req.params.id)}
      },
      {
        $project : {
          orderId: 1,
          user: {
            userId: 1
          },
          orderStatus: 1
        }
      }
    ]);
    if(!data) {
      throw new ErrorHandler('Not able to update');
    }
    orderLogger.info(`Order status updated for Order ID - ${data[0].orderId} to ${data[0].orderStatus} for User ID - ${data[0].user.userId}`);
    res.status(200).json({
      success: true,
      data: result,
    });
  
  } catch (error) {
    console.error('Error while getting updating order', 500);
    orderLogger.info(`Order status updation failed for Order ID - ${data[0].orderId} to ${data[0].orderStatus} for User ID - ${data[0].user.userId}`);
  }
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

exports.getOrderWithItems = catchAsyncError(async (req, res, next) => {
  console.log('we hit here --')
    const orderId = req.params.orderId;
    console.log(orderId);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const orderWithItems = await Order.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(orderId)}
      },
      {
        $project: {
          orderItems: {
            $slice: [
              {
                $map: {
                  input: "$orderItems",
                  as: "item",
                  in: {
                    name: { $ifNull: ["$$item.name", "N/A"]},
                    item_price: { $ifNull: ["$$item.item_price", "N/A"]},
                    quantity: {$ifNull: ["$$item.quantity", "N/A"]},
                    image: {$ifNull: ["$$item.image", "N/A"]},
                    item_total_discount: {$ifNull:  ["$$item.item_total_discount", "N/A"]},
                    item_total_tax: {$ifNull: ["$$item.item_total_tax", "N/A"]},
                    item_total: {$ifNull: ["$$item.item_total", "N/A"]}
                  }
                }
              },
              skip,
              limit
            ]
          },
          total_discount: { $ifNull: ["$total_discount", "N/A"]},
          total_item_count: {$ifNull: ["$total_item_count", "N/A"]},
          total_tax: {$ifNull: ["$total_tax", "N/A"]},
          items_grand_total: {$ifNull: ["$items_grand_total", "N/A"]},
          grand_total: {$ifNull: ["$grandTotal", "N/A"]}
        }
      }    
    ]);
    if(!orderWithItems) {
      throw new ErrorHandler('Dont found worth');
    }
    const totalItems = orderWithItems[0].orderItems.length;
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPage: Math.ceil(totalItems / limit),
      totalItems: totalItems,
      data: orderWithItems
    });
  } catch (error) {
    console.error('Error generating orderId:', error);
    throw new ErrorHandler('Unable to generate orderId', 500);
  }
});

exports.getOrderHistoryByUserId = catchAsyncError (async (req, res, next) => {

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orderHistory = await Order.aggregate([
      {
        $match: { 'user.userId': mongoose.Types.ObjectId(req.params.userId) }
      },
      {
        $addFields: {
          timestampFormatted: {
            $dateToString: {
              format: "%d %B %Y, %H:%M:%S",
              date: "$createdAt",
              timezone: "UTC"
            }
          }
        }
      },
      {
        $project: {
          orderId: { $ifNull: ["$orderId", "N/A"] },
          timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
          totalItems: { $ifNull: [{ $size: "$orderItems" }, "N/A"] },
          orderStatus: { $ifNull: ["$orderStatus", "N/A"] },
          deliveryType: { $ifNull: ["$deliveryType", "N/A"] },
          totalPrice: {$ifNull: ["$totalPrice", "N/A"]}
        }
      },
      { $sort: { createdAt: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);
    if(!orderHistory) {
      throw new ErrorHandler('Some thing went wrong');
    }
    console.log(orderHistory);
    return res.status(200).json({
      success: true,
      page,
      limit,
      total: orderHistory.length,
      totalPage: Math.ceil(orderHistory.length / limit),
      data: orderHistory
    });
  } catch (error) {
    console.error('Error while getting history of order', 500, error.message);
    throw new ErrorHandler('Not able to get order history');
  }
});

exports.getUserBillingInfoByOrderId = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.orderId;
  if(!orderId) {
    throw new ErrorHandler('Order not found', 400);
  }
try {
    const userBillingInfo = await Order.aggregate([
      {
        $match: {_id:  mongoose.Types.ObjectId(orderId)}
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          name: {$ifNull: ['$shippingInfo.billingAddress.name', 'N/A']},
          phone: {$ifNull: ['$shippingInfo.billingAddress.phone', 'N/A']},
          email: {$ifNull: ['$shippingInfo.billingAddress.email', 'N/A']},
          address: {$ifNull: ['$shippingInfo.billingAddress.address', 'N/A']},
          locality: {$ifNull: ['$shippingInfo.billingAddress.locality', 'N/A']},
          landmark: {$ifNull: ['$shippingInfo.billingAddress.landmark', 'N/A']},
          city: {$ifNull: ['$shippingInfo.billingAddress.city', 'N/A']},
          pin_code: {$ifNull: ['$shippingInfo.billingAddress.pin_code', 'N/A']},
          state: {$ifNull: ['$shippingInfo.billingAddress.state', 'N/A']}
        }
      }
    ]);
    if (!userBillingInfo.length) {
      return next(new ErrorHandler('Billing information not found', 404));
    }
    res.status(200).json({
      success: true,
      userBillingInfo: userBillingInfo
    });
} catch (error) {
  console.error('Error while getting user history of order', 500, error.message);
  throw new ErrorHandler('Not able to get user history');
}
});

exports.getUserPaymentDetailByOrderId = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.orderId;
  if(!orderId) {
    throw new ErrorHandler('Order not found', 400);
  }
  try {
    const userPaymentDetail = await Order.aggregate([
      {
        $match : {_id: mongoose.Types.ObjectId(orderId)}
      }, 
      {
        $project: {
          _id: 0,
          paymentType: {$ifNull: ["$paymentInfo.payment_type", "N/A"]},
          status: {$ifNull: ["$paymentInfo.status", "N/A"]},
          amount: {$ifNull: ["$paymentInfo.amount", "N/A"]}
        }
      }
    ]);
    if(!userPaymentDetail.length) {
      return next(new ErrorHandler('User payment status not found', 404));
    }
    res.status(200).json({
      success: true,
      userPaymentDetail: userPaymentDetail[0]
    });
  } catch (error) {
    console.error('Error while getting user history of order', 500, error.message);
    throw new ErrorHandler('Not able to get user history');  
  }
});

exports.getUserDeliveryInfoByOrderId = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.orderId;
  if(!orderId) {
    throw new ErrorHandler('Order not found', 404);
  }
  try {
    const userDeliveryDetail = await Order.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(orderId)}
      },
      {
        $project: {
          _id: 0,
          deliveryType: {$ifNull: ["$deliveryInfo.deliveryType", "N/A"]},
          deliveryCost: {$ifNull: ["$deliveryInfo.deliveryCost", "N/A"]},
          name: {$ifNull: ["$deliveryInfo.deliveryPartner.name", "N/A"]},
          phone: {$ifNull: ["$deliveryInfo.deliveryPartner.phone", "N/A"]},
          email: {$ifNull: ["$deliveryInfo.deliveryPartner.email", "N/A"]}
        }
      }
    ]);
    if(!userDeliveryDetail.length) {
      return next(new ErrorHandler('Delivery detail not found', 404));
    }
    res.status(200).json({
      success: true,
      userDeliveryDetail: userDeliveryDetail[0]
    })
  } catch (error) {
    console.error('Error while getting user delivery details of the order', 500, error.message);
    throw new ErrorHandler('Not able to get user delivery info');  
  }
});

exports.getCustomOrderIdByOrderId = (catchAsyncError (async (req, res, next) => {

  const orderId = req.params.orderId;
  try {
    const customOrderId = await Order.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(orderId)}
      },
      {
        $project: {
          orderId: {$ifNull: ["$orderId", "N/A"]}
        }
      }
    ]);
    if(!customOrderId) {
      throw new ErrorHandler('Order not found', 404);
    }
    res.status(200).json({
      success: true,
      data: customOrderId[0]
    });
  } catch (error) {
    console.log(error.message);
    throw new ErrorHandler('Something wrong happend', 400);
  }
}));

exports.updatePaymentStatusByOrderId = catchAsyncError (async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required in the request body'
      });
    }

    // Find the order by orderId and update the paymentInfo.status
    const updatedOrder = await Order.findOneAndUpdate(
      {_id: orderId },
      { 'paymentInfo.status': status
       }, 
      { new: true, runValidators: true } 
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Something wrong happened while updating order'
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

exports.getQuantityWiseOrderByOrderId = (catchAsyncError (async (req, res, next) => {

  try {
    const orderId = req.params.orderId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const quantityWiseOrder = await Order.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(orderId)}
      },
      {
        $project: {
          orderItems: {
            $slice: [
              {
                $map: {
                  input: "$orderItems",
                  as: "item",
                  in : {
                    name: {$ifNull: ["$$item.name", "N/A"]},
                    quantity: {$ifNull: ["$$item.quantity", "N/A"]},
                    image: {$ifNull: ["$$item.image", "N/A"]}
                  }
                }
              },
              skip,
              limit
            ]
          },
          total_quantity: {$ifNull: ["$total_quantity" , "N/A"]}
        }
      }
    ]);
    if(!quantityWiseOrder){
     throw new ErrorHandler('Not found', 500);
    }
   const totalItems = quantityWiseOrder[0].orderItems.length;
   return res.status(200).json({
    success: true,
    page,
    limit,
    totalPage: Math.ceil(totalItems / limit),
    totalItems: totalItems,
    data: quantityWiseOrder[0]
   });
  } catch (error) {
    console.error(error.message);
    throw new ErrorHandler('Something went wrong', 400);
  }
}));

exports.markOrderStatusPaidByOrderId = (catchAsyncError (async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const {amount} = req.body;
    console.log(amount);
    if(!amount) {
      return res.status(400).json({
        success: false,
        message: 'amount is required in the request body'
      });
    }
    const updatedOrder = await Order.findOneAndUpdate(
      {_id: orderId},
      {'paymentInfo.status': "completed",
        'paymentInfo.amount': amount
      },
      { new : true, runValidators: true}
    );
    console.log(updatedOrder);
    if(!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Something wrong happened while updating order',
      });
    }
    res.status(200).json({
      success: true,
      message: `Order status updated to Paid`,
      order: updatedOrder
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something wrong happend while updating order status');
  }
}));

exports.markOrderStatusToCancelledByOrderId = (catchAsyncError (async (req, res, next) => {
  try {
    const {orderId} = req.params;
    const cancelledOrder = await Order.findOneAndUpdate(
      {_id: orderId},
      {'orderStatus': 'cancelled'},
      { new: true, runValidators: true}
    );
    if(!cancelledOrder) {
      return res.status(404).json({
        success: false,
        message: 'something wrong happed while updating order status to cancelled'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Updated successfully',
      data: cancelledOrder
    });

  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Some thing wrong happed while updating order status');
  }
}));

exports.getSingleOrderStatusByOrderId = (catchAsyncError (async (req, res, next) => {
  try {
    const {orderId} = req.params;
    console.log(orderId);
    const orderStatus = await Order.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(orderId)}
      },
      {
        $project: {
          status: {$ifNull: ["$orderStatus", "N/A"]}
        }
      }
    ]);
    return res.status(200).json({
      success: true,
      data: orderStatus[0]
    });
  } catch (error) {
    console.error(error.message);
    throw new ErrorHandler('Something went wrong while getting order status');
  }
}));

exports.markOrderStatusAsDeliveredByOrderId = (catchAsyncError (async (req, res, next) => {
  try {
    const {orderId} = req.params;
    const deliveredStatusOrder = await Order.findOneAndUpdate(
      {_id: orderId},
      {
        'orderStatus' : 'delivered',
        'deliverAt' : Date.now()
      }
    );
    if(!deliveredStatusOrder) {
      return res.status(404).json({
        success: false,
        message: 'Not able to marked order status as delivered'
      });
    }
    return res.status(200).json({
      success: true,
      data: deliveredStatusOrder
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong', 404);
  }
}));

exports.getOrderByOrderIdForUser = (catchAsyncError (async (req, res, next) => {
  try {
    const orderId = req.params.orderId
    if(!orderId) {
      throw new ErrorHandler('orderId not valid', 404);
    }
    const OrderForUser = await Order.findById({_id: orderId});

    return res.status(200).json({
      success: true,
      data: OrderForUser
    });
  } catch (error) {
    console.error('error while getting, order by Id');
    throw new ErrorHandler('Some thing went wrong while getting order by order Id');
  }
}));

exports.updateDeliveryDetailsToOrder = (catchAsyncError (async (req, res, next) => {
  try {
    const {orderId} = req.params;
    const {
      type,
      name,
      phone,
      email
    } = req.body;
    const deliveryPartnerDetails = await Order.findOneAndUpdate(
      {_id: orderId},
      {
        'deliveryInfo.deliveryType' : type === '1' ? 'Third party delivery partner' : 'In house delivery partner' || null,
        'deliveryInfo.deliveryPartner.name' : name || null,
        'deliveryInfo.deliveryPartner.phone': isNaN(phone) ? null : phone,
        'deliveryInfo.deliveryPartner.email' : email || null
      }
    );
    if(!deliveryPartnerDetails) {
      return res.status(404).json({
        success: false,
        message: 'Not able to update delivery partner details'
      });
    }
    return res.status(200).json({
      success: true,
      data: deliveryPartnerDetails
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong while updating delivery partner details');
  }
}));



