const Notification = require('../models/notificationModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');


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
                            timezone: "UTC"
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
                    lastLive: {$ifNull: ["$timestampFormatted", "N/A"]}
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
                        //customers are left to take
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
        const {notificationId} = req.params;
        let updateData = req.body;
        const {secure_url} = await cloudinary.uploader.upload(updateData.image, {
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
