const mongoose = require('mongoose');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');

exports.getOrderLogsByUserId = catchAsyncError(async (req, res, next) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Mongoose is not connected');
    }

    const orderLogsCollection = mongoose.connection.collection('orderLogs');

    // const results = await orderLogsCollection.aggregate([
    //     {
    //         $match: {
    //             message: { $regex: `User ID - ${userId}`, $options: 'i' } 
    //         }
    //     },
    //     {
    //         $facet: {
    //             paginatedResults: [
    //                 { $project: { timestamp: 1, level: 1, message: 1 } },
    //                 { $sort: { createAt: 1 } },
    //                 { $skip: skip },
    //                 { $limit: limit }
    //             ],
    //             totalCount: [
    //                 { $count: 'count' }
    //             ]
    //         }
    //     }
    // ]).toArray();

    const results = await orderLogsCollection.aggregate([
      {
        $match: {
          message: {$regex: `User ID - ${userId}`, $options: 'i'},
        },
      },
      {
        $addFields: {
          extractedUserId: {
            $let: {
              vars: {
                match: {
                  $regexFind: {
                    input: "$message",
                    regex: /User ID - (\w+)/
                  }
                }
              },
              in: {
                $ifNull: [
                  "$$match.captures",
                  []
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          extractedUserId: {
            $cond: {
              if: { $gt: [{ $size: "$extractedUserId" }, 0] },
              then: { $arrayElemAt: ["$extractedUserId", 0] },
              else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "extractedUserId",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $project: {
          timestamp: 1,
          level: 1,
          message: 1,
          extractedUserId: 1,
          userInfo: 1,
        }
      }
    ]).toArray();
            console.log(results);



    // const totalCount = await orderLogsCollection.aggregate([
    //     {
    //       $match: {
    //         message: { $regex: `User ID - ${userId}`, $options: "i" },
    //       },
    //     },
    //     { $count: "count" },
    //   ]).toArray();
    // const count = totalCount.length > 0 ? totalCount[0].count : 0;
    // // const totalCount = results[0]?.totalCount[0]?.count || 0;

    if (results.length === 0) {
      return next(new ErrorHandler('No log found for this user', 400));
    }


    res.status(200).json({
      success: true,
      // page,
      // limit,
      // totalPages: Math.ceil(totalLogs / limit),
      // totalLogs: totalLogs,
      // data: results,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
