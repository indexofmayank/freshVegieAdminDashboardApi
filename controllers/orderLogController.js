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
    const results = await orderLogsCollection.aggregate([
      {
        $match: {
          message: { $regex: `User ID - ${userId}`, $options: 'i' },
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
        $addFields: {
          extractedUserId: { $toObjectId: "$extractedUserId", }
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
        $addFields: {
          username: { $arrayElemAt: ["$userInfo.name", 0] }
        }
      },
      {
        $addFields: {
          message: {
            $replaceOne: {
              input: "$message",
              find: `User ID - ${userId}`,
              replacement: { $concat: ["User ID - ", "$username"] },
            },
          },
        },
      },
      {
        $addFields: {
          timestampFormatted: {
            $dateToString: {
              "format": "%d %B %Y, %H:%M:%S",
              "date": "$timestamp",
              "timezone": "UTC"
            }
          }
        }
      },
      {
        $project: {
          timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
          message: { $ifNull: ["$message", "N/A"] },
        }
      },
      {
        $sort: { timestampFormatted: 1 } // Changed to -1 for sorting newest to oldest
      }, { $skip: skip },
      { $limit: limit }
    ]).toArray();
    const totalCount = await orderLogsCollection.aggregate([
      {
        $match: {
          message: { $regex: `User ID - ${userId}`, $options: "i" },
        },
      },
      { $count: "count" },
    ]).toArray();
    const count = totalCount.length > 0 ? totalCount[0].count : 0;
    if (results.length === 0) {
      return next(new ErrorHandler('No log found for this user', 400));
    }
    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalLogs: count,
      data: results,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getTest = catchAsyncError(async (req, res, next) => {
  const userId = req.params.userId;

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Mongoose is not connected');
    }
    const orderLogsCollection = mongoose.connection.collection('orderLogs');
    const results = await orderLogsCollection.aggregate([
      {
        $match: {
          message: { $regex: `User ID - ${userId}`, $options: 'i' },
        },

      },
      {
        // Replace the user ID in the message with 'mayank'
        $addFields: {
          message: {
            $replaceOne: {
              input: "$message",
              find: `User ID - ${userId}`,
              replacement: 'User ID - mayank'
            }
          }
        }
      },
    ]).toArray();
    console.log(results);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error: ', error.message);
    res.status(500).json({ success: false, error: error.message });
  }

});
