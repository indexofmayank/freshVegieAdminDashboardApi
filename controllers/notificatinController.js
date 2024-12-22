const Notification = require('../models/notificationModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const axios = require('axios');
const path = require('path');

const serviceAccount = require('./fresh-vegi-bb1a1-f7eb7c5b59cc.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// Path to your service account JSON key file
const serviceAccountKeyFile = path.join(__dirname, 'fresh-vegi-bb1a1-f7eb7c5b59cc.json');
console.log(serviceAccountKeyFile);
// Initialize Google Auth
const getAccessToken = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyFile,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const accessToken = await auth.getAccessToken();
  return accessToken;
};

// Function to send FCM notification
const sendNotification = async (deviceTokens, title, body, imageUrl, data) => {
    const accessToken = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/fresh-vegi-bb1a1/messages:send`;
//   console.log(deviceTokens);
//   console.log(deviceTokens.length);

    for (const token of deviceTokens) {
       
     try {
        // console.log(token.fcm_token);
        const payload = {
            message: {
            token: token.fcm_token, // Single device token (use loop for multiple)
            notification: {
                title: title,
                body: body,
                image: imageUrl,
            },
            data: data,
            },
        };
       
    const response = await axios.post(fcmUrl, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Notification sent:', response.data);
    } catch (error) {
        console.error('Error sending notification:', error.response?.data || error.message);
      }
  }
  };

exports.createNoficiation = catchAsyncError (async (req, res, next) => {
try {
    console.log(req.body);
    let {name, heading, message, redirect_to, specific_product, specific_category, link, audience, branch, customFilters, customers, status, image} = req.body;
    const {secure_url} = await cloudinary.uploader.upload(image, {
        folder: 'tomper-wear'
    });
    image = secure_url;
    const newNotification = await Notification.create({
        name,
        heading,
        message,
        redirect_to,
        specific_product,
        specific_category,
        link,
        audience,
        branch,
        customFilters,
        customers,
        status,
        image
    });
    console.log(newNotification);
    if(!newNotification) {
        throw new ErrorHandler('Not able to create notification');
    }
    res.status(200).json({
        success: true,
        data: newNotification
    });
} catch (error) {
    console.log(error);
    throw new ErrorHandler('Something went wrong create notification');
}
});

exports.getAllNotificationForTable = catchAsyncError(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const notifications = await Notification.aggregate([
            {   
                $addFields: {
                    timestampFormatted: {
                        $dateToString: {
                            format: "%d %B %Y, %H:%M:%S",
                            date: "$lastLive",
                            timezone: "Asia/Kolkata",
                        }
                    }
                }
            },
            {
                $project: {
                    name: {$ifNull: ["$name", "N/A"]},
                    redirect_to: {$ifNull: ["$redirect_to", "N/A"]},
                    audience: {$ifNull: ["$audience", "N/A"]},
                    banner: {$ifNull: ["$image", "N/A"]},
                    status: {$ifNull: ["$status", "N/A"]},
                    lastLive: {$ifNull: ["$timestampFormatted", "N/A"]},
                    message: {$ifNull: ["$message", "N/a"]},
                    heading: {$ifNull: ["$heading", "N/a"]}
                }
            },
            {
                $sort: {name: 1}
            },
            {$skip: skip},
            {$limit: limit}
        ]);
        if(!notifications) {
            throw new ErrorHandler('Not able to getting notifications');
        }

        return res.status(200).json({
            success: true,
            page,
            limit,
            total: notifications.length,
            totalPage: Math.ceil(notifications.length / limit),
            data: notifications
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('Something went wrong while getting notification');
    }
});

exports.getNotificationById = catchAsyncError (async (req, res, next) => {
    try {
        const {notificationId} = req.params;
        const notification = await Notification.aggregate([
            {
                $match: {_id: mongoose.Types.ObjectId(notificationId)}
            },
            {
                    $project: {
                        name: {$ifNull: ["$name", "N/A"]},
                        heading: {$ifNull: ["$heading", "N/A"]},
                        message: {$ifNull: ["$message",, "N/A"]},
                        redirect_to: {$ifNull: ["$redirect_to", "N/A"]},
                        specific_product: {$ifNull: ["$specific_product", "N/A"]},
                        specific_category: {$ifNull: ["$specific_category", "N/A"]},
                        link: {$ifNull: ["$link", "N/A"]},
                        audience: {$ifNull: ["$audience", "N/A"]},
                        banner: {$ifNull: ["$image", "N/A"]},
                        customFilters: {$ifNull: ["$customFilters", "N/A"]},
                        customers: 1,
                        status: {$ifNull: ["$status", "N/A"]},
                        // lastLive: {$ifNull: ["$timestampFormatted", "N/A"]}
                    }
            }
        ]);
        if(!notification) {
            throw new ErrorHandler('Not able to getting notification');
        }
        return res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('Something went wrong getting notification');
    }
});

exports.updateNotificationById = catchAsyncError(async (req, res, next) => {
    try {
        console.log('update_notification_req_modal: ', req.body);
        const {notificationId} = req.params;
        let updateData = req.body;
        let image = req.body.banner;
        const {secure_url} = await cloudinary.uploader.upload(req.body.banner, {
            folder: 'tomper-wear'
        });
        updateData.image = secure_url;
        const result = await Notification.findByIdAndUpdate(notificationId, updateData, {new: true});
        if(!result) {
            return res.status(500).json({
                success: false,
                message: 'Server error'
            });
        } 
        console.log('update_notification_result_modal: ', result);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('Something wrong happend while updating given notification');
    }
});

exports.deleteNotificationById = catchAsyncError (async (req, res, next) => {
    try {
        const {notificationId} = req.params;
        if(!notificationId) {
            return next(new ErrorHandler('Notification not found', 400));
        }
        const notification = await Notification.findById(notificationId);
        if(!notification) {
            return next(new ErrorHandler('Notification not found'));
        }
        await notification.remove();
        return res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('Something went wrong while deleting notification');
    }
});

exports.getAllProductForNotification = (catchAsyncError (async (req, res, next) => {
    try {
        const products = await Product.aggregate([
            {
                $project: {
                    name: {$ifNull: ["$name", "N/A"]}
                }
    
            }
        ]);
        return res.status(200).json({
            success: true,
            data: products
        });
        if(!products) {
            return new ErrorHandler('Not found', 404);
        }
    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something went wrong while getting product name for notification');
    }
}));

exports.getAllCategoryForNotification = (catchAsyncError (async (req, res, next) => {
    try {
        const category = await Category.aggregate([
            {
                $project: {
                    name: {$ifNull: ["$name" , "N/A"]}
                }
            }
        ]);
        if(!category) {
            return new ErrorHandler('Not found', 404);
        }
        return res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something went wrong while getting category name for notification');
    }
}));

exports.getAllUserForNotification = (catchAsyncError (async (req, res, next) => {
    const matchCondition = {'fcm_token': {$ne: null}}
    try {
        const users = await User.aggregate([
            {
                $match: matchCondition
            },
            {
                $project: {
                    fcm_token: 1
                }
            }
        ]);
        if(!users) {
            return new ErrorHandler('Not found', 404);
        }
        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something went wrong while getting user for notification');
    }
}));

exports.getUserFcmTokenByUserId = catchAsyncError(async (req, res, next) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid userIds array'
            });
        }

        const fcmTokenList = await User.aggregate([
            {
                $match: {
                    _id: { $in: userIds.map(id => mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $project: {
                    _id: 1,
                    fcm_token: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: fcmTokenList
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// exports.getUserNamesForNotification = catchAsyncError(async (req, res, next) => {

//     try {
//         const usersWithZeroOrders = await User.aggregate([
//           {
//             $lookup: {
//               from: 'orders', 
//               localField: '_id', 
//               foreignField: 'user.userId', 
//               as: 'orders' 
//             }
//           },
//           {
//             $match: {
//               'orders': { $size: 0 } 
//             }
//           },
//           {
//             $project: {
//               _id: 1,
//               name: 1,
//             }
//           }
//         ]);
    
//         // Send the result
//         res.status(200).json({
//           success: true,
//           users: usersWithZeroOrders
//         });
//       } catch (error) {
//         res.status(500).json({
//           success: false,
//           message: error.message
//         });
//     }
// })

exports.getUserNamesForNotification = catchAsyncError(async (req, res, next) => {
    console.log('we came here');
    try {
        let matchCondition = {};

        switch (req.query.filter) {
            case 'zeroOrders':
                console.log('inside zero');
                matchCondition = {
                    'orders': { $size: 0 } 
                };
                break;

            case 'moreThanOneOrder':
                console.log('inside multiple');
                const usersWithMultipleOrders = await Order.aggregate([
                    {
                        $group: {
                            _id: '$user.userId',
                            orderCount: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            orderCount: { $gt: 1 } 
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: '$userDetails'
                    },
                    {
                        $project: {
                            'userDetails._id': 1,
                            'userDetails.name': 1
                        }
                    }
                ]);

                return res.status(200).json({
                    success: true,
                    users: usersWithMultipleOrders.map(user => user.userDetails)
                });

            case 'all':
                console.log('inside all');
                matchCondition = {}; // No filter, match all users
                break;

            default:
                console.log('inside default');
                return res.status(200).json({
                    success: true,
                    message: 'Invalid filter provided',
                    users: []
                });
        }

        // Fetch users based on the matchCondition (for both 'zeroOrders' and 'all')
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'user.userId',
                    as: 'orders'
                }
            },
            {
                $match: matchCondition
            },
            {
                $project: {
                    _id: 1,
                    name: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

exports.pushNotification = catchAsyncError(async (req, res, next) => {
    try {
        const notificationId = mongoose.Types.ObjectId(req.params.id);

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        const { customFilters } = notification;
        let matchCondition = {};

        switch (customFilters) {
            case 'zeroOrders':
                console.log('Filter: Zero Orders');
                matchCondition = {
                    'orders': { $size: 0 } 
                };
                break;

            case 'new':
                console.log('Filter: New Users');
                matchCondition = {
                    'orders': { $ne: [] } 
                };
                break;

            case 'all':
                console.log('Filter: All Users');
                matchCondition = {}; 
                break;

            default:
                console.log('Invalid custom filter');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid custom filter provided in the notification'
                });
        }

        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'user.userId',
                    as: 'orders'
                }
            },
            {
                $match: matchCondition
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    fcm_token: 1
                }
            }
        ]);

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found matching the criteria'
            });
        }

        return res.status(200).json({
            success: true,
            notification,
            users
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing the push notification'
        });
    }
});

exports.sendNotification = catchAsyncError (async (req, res, next) => {
    try {
        console.log(req.body);
        const matchCondition = {'fcm_token': {$ne: null}}
        const users = await User.aggregate([
            {
                $match: matchCondition
            },
            {
                $project: {
                    fcm_token: 1
                }
            }
        ]);
        // const notificationId = mongoose.Types.ObjectId(req.body.id);

        const notification = await Notification.findById(req.body.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        // console.log(users)
        // console.log(notification)
        sendNotification(
            // ['fKBFbnT1QiazCJqk6lqmcd:APA91bFiC27OLgGZYDr3C_vHQZLrk-pUMu3GdH_LHoDQRkrEx0c3me5OwMLL68wkhHxS1K5DPLBqNIecUuaFjIKxBdqWtIv8grBY4T2LXjZlkFwN0wOSPBc','eknfAlMfRiu3UK8fpXAG5K:APA91bFJL_Z-mc9g8SeuSsMX_hmp3Hi3KLqG_DS2Wy-2qB4LF7zvqIqyrO-e2uB8kNP7ZzyzfHPXp2JUoW1-ZUboRfkvOkuQpNr0znGdwLA00651NubCUfM','eXB5yZRpQRGuDkCPVaeu2w:APA91bGFJuz4CkRvXWOASAhdi9nXyjQauBE95uWz71SsMrAu97lDEPvu8fjdxmI1m5pjudBBAyKmDYSGFxNeOFkGmoXvdrHsyTCBqiuUg2ZpS7HsU2JZ85liZUv3La9nBG_j3h0Y3JcC'], // Replace with your device tokens
            users,
            notification.name,
            notification.message,
            notification.image,
            { screen: 'HomePage', saleId: '56789' }
          );
        // let {name, heading, message, redirect_to, specific_product, specific_category, link, audience, branch, customFilters, customers, status, image} = req.body;
        return res.status(200).json({
            success: true,
            message:"Notification sent sucessfully"
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('Something went wrong create notification');
    }
    });
