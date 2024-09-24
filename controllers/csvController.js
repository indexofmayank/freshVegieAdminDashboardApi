const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

exports.createCSVfileForOrder = catchAsyncError(async (req, res, next) => {
  try {
    const Orders = await Order.aggregate([
      {
        $match: { orderStatus: 'received' }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user.userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          createdAtTimesFormatted: {
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
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                name: { $ifNull: ["$$item.name", "N/A"] },
                item_price: { $ifNull: ["$$item.item_price", "N/A"] },
                quantity: { $ifNull: ["$$item.quantity", "N/A"] },
                item_total_discount: { $ifNull: ["$$item.item_total_discount", "N/A"] },
                item_total_tax: { $ifNull: ["$$item.item_total_tax", "N/A"] },
                item_total: { $ifNull: ["$$item.item_total", "N/A"] },
              }
            }
          },
          customer: { $ifNull: ["$user.name", "N/A"] },
          customer_address: { $ifNull: ["$shippingInfo.deliveryAddress", "N/A"] },
          mobile: {$toString: { $ifNull: ["$userDetails.phone", "N/A"] }},
          delivery_type: { $ifNull: ["$deliveryTpye", "N/A"] },
          payment_type: { $ifNull: ["$paymentInfo.payment_type", "N/A"] },
          ordered_date: { $ifNull: ["$createdAtTimesFormatted", "N/A"] }
        }
      }
    ]);
    const csvFilePath = path.join(__dirname, '../output.csv');
    console.log(csvFilePath);
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'orderNo', title: 'Order No' },
        { id: 'productName', title: 'Product Name' },
        { id: 'productPrice', title: 'Product Price' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'grandTotal', title: 'Grand Total' },
        { id: 'customer', title: 'Customer' },
        { id: 'address', title: 'Address' },
        { id: 'mobile', title: 'Mobile' },
        { id: 'deliveryType', title: 'Delivery Type' },
        { id: 'paymentType', title: 'Payment Type' },
        { id: 'orderedDate', title: 'Ordered Date' },
        { id: 'tax', title: 'Tax' },
        { id: 'totalTax', title: 'Total Tax' }
      ],
    });
    const records = [];
    console.log(Orders);
    Orders.forEach(order => {
      order.orderItems.forEach(item => {
        records.push({
          orderNo: order.orderId,
          productName: item.name,
          productPrice: item.item_price,
          quantity: item.quantity,
          grandTotal: item.item_total,
          tax: item.item_total_tax,
          totalTax: item.item_total_tax,
          customer: order.customer,
          address: order.customer_address.address + " " + order.customer_address.city + " " + order.customer_address.locality + " " + order.customer_address.landmark + " " + order.customer_address.state + " " + order.customer_address.pin_code,
          mobile: order.mobile,
          deliveryType: order.delivery_type,
          paymentType: order.payment_type,
          orderedDate: order.ordered_date
        });

      })
    });
    const csvContent = await csvWriter.writeRecords(records);
    res.header('Content-Type', 'text/csv');
    res.attachment('Orders.csv');

    const csvFileStream = fs.createReadStream(csvFilePath);
    csvFileStream.pipe(res).on('finish', () => {
      // Optionally, delete the file after sending it
      fs.unlinkSync(csvFilePath);
    });
    // res.header('Content-Type', 'text/csv');
    // res.attachment('Orders.csv');
    // res.send(csvContent);
  } catch (error) {
    console.error(error);
    next(new ErrorHandler('Something went wrong while generating the CSV file', 500));
  }
});
