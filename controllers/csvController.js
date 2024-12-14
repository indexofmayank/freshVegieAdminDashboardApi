const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter, createObjectCsvStringifier } = require('csv-writer');

exports.createCSVfileForOrder = catchAsyncError(async (req, res, next) => {
  try {
    const filter = req.query.filter;
    const period = req.query.period;
    const startDate = req.query.startDate;
    const endDate= req.query.endDate;
    const tableLabel = req.query.tableLabel.toLowerCase();
    let matchCondition = {};
    const currentDate = new Date();
    matchCondition.orderStatus = tableLabel;

    if (period === 'custom' && startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    } else {
      switch (filter) {
        case 'Day':
          matchCondition.createdAt = {
            $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            $lt: new Date(currentDate.setHours(23, 59, 59, 999))
          };
          break;

        case 'Week':
          const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
          const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));
          matchCondition.createdAt = {
            $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
            $lt: new Date(endOfWeek.setHours(23, 59, 59, 999))
          };
          break;
        case 'Month':
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());    
          matchCondition.createdAt = {
            $gte: new Date(startOfMonth.setHours(0, 0, 0, 0)),
            $lt: new Date(endOfMonth.setHours(23, 59, 59, 999))
          };
          break;
        case 'Year':
          const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
          const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
          matchCondition.createdAt = {
            $gte: new Date(startOfYear.setHours(0, 0, 0, 0)),
            $lt: new Date(endOfYear.setHours(23, 59, 59, 999))
          };
          break;
        default:
          break;

      }
    }

    // console.log(matchCondition);

    const Orders = await Order.aggregate([
      {
        $match: { ...matchCondition }
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
        $lookup: {
          from: "products",        // The name of the products collection
          localField: "orderItems.id", // Field in the orders collection
          foreignField: "_id",     // Field in the products collection
          as: "productDetails"     // Name for the joined field
        }
      },
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                $mergeObjects: [
                  "$$item",
                  {
                    $let: {
                      vars: {
                        matchedProduct: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$productDetails",
                                as: "product",
                                cond: { $eq: ["$$product._id", "$$item.id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: {
                        product_weight: { $ifNull: ["$$matchedProduct.product_weight", "N/A"] },
                        product_weight_type: { $ifNull: ["$$matchedProduct.product_weight_type", "N/A"] }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          createdAtTimesFormatted: {
            $dateToString: {
              format: "%d %B %Y, %H:%M:%S",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            }
          }
        }
      },
      {
        $project: {
          orderId: { $ifNull: ["$orderId", "N/A"] },
          orderItems: 1,
          customer: { $ifNull: ["$user.name", "N/A"] },
          customer_address: { $ifNull: ["$shippingInfo.deliveryAddress", "N/A"] },
          mobile: { $toString: { $ifNull: ["$userDetails.phone", "N/A"] } },
          delivery_type: { $ifNull: ["$deliveryTpye", "N/A"] },
          payment_type: { $ifNull: ["$paymentInfo.payment_type", "N/A"] },
          ordered_date: { $ifNull: ["$createdAtTimesFormatted", "N/A"] },
          orderStatus: { $ifNull: ["$orderStatus", "N/A"] }
        }
      }
    ]);

    // Log the mapped orderItems for debugging
    // console.log(JSON.stringify(Orders, null, 2));
    // Orders.forEach(order => {
    //   console.log("Order:", order.orderId);
    //   console.log("Product Details:", order.productDetails);
    //   order.orderItems.forEach(item => {
    //     console.log("Item:", item);
    //   });
    // });

    // console.log(Orders);
    // console.log(Orders.orderItems);
    const csvFilePath = path.join(__dirname, '../output.csv');
    // console.log(csvFilePath);
    const csvStringifier = createObjectCsvStringifier({
      // path: csvFilePath,
      header: [
        { id: 'orderNo', title: 'Order No' },
        { id: 'productName', title: 'Product Name' },
        { id: 'productPrice', title: 'Product Price' },
        { id: 'productOfferPrice', title: 'Offer Price' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'productWeight', title: 'Product weight' },
        { id: 'productWeightType', title: 'Product weight type' },
        { id: 'grandTotal', title: 'Grand Total' },
        { id: 'customer', title: 'Customer' },
        { id: 'address', title: 'Address' },
        { id: 'mobile', title: 'Mobile' },
        { id: 'deliveryType', title: 'Delivery Type' },
        { id: 'paymentType', title: 'Payment Type' },
        { id: 'orderedDate', title: 'Ordered Date' },
        { id: 'tax', title: 'Tax' },
        { id: 'totalTax', title: 'Total Tax' },
        { id: 'orderStatus', title: 'Order Status' }
        
      ],
    });
    const records = [];
    // console.log(Orders.orderItems);
    Orders.forEach(order => {
      order.orderItems.forEach(item => {
        // console.log(item)
        records.push({
          orderNo: order.orderId,
          productName: item.name,
          productPrice: item.item_price,
          productOfferPrice: item.offer_price,
          quantity: item.quantity,
          productWeight: item.product_weight,
          productWeightType: item.product_weight_type,
          grandTotal: item.item_total,
          tax: item.item_total_tax,
          totalTax: item.item_total_tax,
          customer: order.customer,
          address: order.customer_address.address + " " + order.customer_address.city + " " + order.customer_address.locality + " " + order.customer_address.landmark + " " + order.customer_address.state + " " + order.customer_address.pin_code,
          mobile: order.mobile,
          deliveryType: order.delivery_type,
          paymentType: order.payment_type,
          orderedDate: order.ordered_date,
          orderStatus : order.orderStatus
        });

      })
    });
    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    // Send CSV as response
    res.header('Content-Type', 'text/csv');
    res.attachment('Orders.csv');
    res.send(csvContent);
    // const csvContent = await csvWriter.writeRecords(records);
    // res.header('Content-Type', 'text/csv');
    // res.attachment('Orders.csv');

    // const csvFileStream = fs.createReadStream(csvFilePath);
    // csvFileStream.pipe(res).on('finish', () => {
    //   // Optionally, delete the file after sending it
    //   fs.unlinkSync(csvFilePath);
    // });
    // res.header('Content-Type', 'text/csv');
    // res.attachment('Orders.csv');
    // res.send(csvContent);
  } catch (error) {
    console.error(error);
    next(new ErrorHandler('Something went wrong while generating the CSV file', 500));
  }
});
