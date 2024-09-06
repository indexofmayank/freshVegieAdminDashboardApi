const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');

exports.getOrdersForTable = catchAsyncError(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let label = req.query.label;
    label = label.toLowerCase();

    // Count the total number of documents matching the label
    const totalOrdersCount = await Order.countDocuments({ orderStatus: label });

    const orders = await Order.aggregate([
      {
        $match: { orderStatus: label }
      },
      {
        $addFields: {
          timestampFormatted: {
            $dateToString: {
              format: "%d %B %Y, %H:%M:%S",
              date: "$createdAt",
              timezone: "UTC"
            }
          },
          orderItemsCount: { $size: "$orderItems" }
        }
      },
      {
        $lookup: {
          from: "users", // Name of the collection where users are stored
          localField: "user.userId", // Field in the Order collection to match
          foreignField: "_id", // Field in the User collection to match
          as: "userDetails" // Alias for the result
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true // Include orders even if there's no matching user
        }
      },
      {
        $project: {
          order_no: { $ifNull: ["$orderId", "N/A"] },
          timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
          customerName: { $ifNull: ["$userDetails.name", "N/A"] }, // Get the user name from the joined collection
          orderItemsCount: { $ifNull: ["$orderItemsCount", "N/A"] },
          totalQuantity: { $ifNull: ["$total_quantity", "N/A"] },
          location: { $ifNull: ["$shippingInfo.deliveryAddress.city", "N/A"] },
          paymentType: { $ifNull: ["$paymentInfo.payment_type", "N/A"] },
          status: { $ifNull: ["$orderStatus", "N/A"] },
          amount: { $ifNull: ["$grandTotal", "N/A"] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalOrdersCount / limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages,
      data: orders
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler("Something went wrong while getting orders for delivery");
  }
});

exports.getRecentOrderForTable = catchAsyncError (async (req, res, next) => {
  try { 
    console.log('we can here');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count the total number of documents matching the label
    const totalOrdersCount = await Order.countDocuments({});

    const orders = await Order.aggregate([
      {
        $addFields: {
          timestampFormatted: {
            $dateToString: {
              format: "%d %B %Y, %H:%M:%S",
              date: "$createdAt",
              timezone: "UTC"
            }
          },
          orderItemsCount: { $size: "$orderItems" }
        }
      },
      {
        $lookup: {
          from: "users", // Name of the collection where users are stored
          localField: "user.userId", // Field in the Order collection to match
          foreignField: "_id", // Field in the User collection to match
          as: "userDetails" // Alias for the result
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true // Include orders even if there's no matching user
        }
      },
      {
        $project: {
          order_no: { $ifNull: ["$orderId", "N/A"] },
          timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
          customerName: { $ifNull: ["$userDetails.name", "N/A"] }, // Get the user name from the joined collection
          orderItemsCount: { $ifNull: ["$orderItemsCount", "N/A"] },
          totalQuantity: { $ifNull: ["$total_quantity", "N/A"] },
          location: { $ifNull: ["$shippingInfo.deliveryAddress.city", "N/A"] },
          paymentType: { $ifNull: ["$paymentInfo.payment_type", "N/A"] },
          status: { $ifNull: ["$orderStatus", "N/A"] },
          amount: { $ifNull: ["$grandTotal", "N/A"] }
        }
      },
      {
        $sort: { order_no: -1 }
      },
      { $skip: skip },
      { $limit: limit }
    ]);
    const totalPages = Math.ceil(totalOrdersCount / limit);
    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages,
      data: orders
  });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler("Something went wrong while getting orders for delivery");
  }
});
  