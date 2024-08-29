const Notification = require('../models/notificationModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');


exports.createNoficiation = catchAsyncError (async (req, res, next) => {
try {
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
        const notificationId = req.params;
        const notification = await Notification.aggregate([
            {
                $match: {_id: mongoose.Types.ObjectId(notificationId)}
            },
            {
                $project: {
                    $project: {
                        name: {$ifNull: ["$name", "N/A"]},
                        redirect_to: {$ifNull: ["$redirect_to", "N/A"]},
                        audience: {$ifNull: ["$audience", "N/A"]},
                        banner: {$ifNull: ["$image", "N/A"]},
                        status: {$ifNull: ["$status", "N/A"]},
                        // lastLive: {$ifNull: ["$timestampFormatted", "N/A"]}
                    }
    
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
    try {
        const users = await User.aggregate([
            {
                $project: {
                    name: {$ifNull: ["$name", "N/A"]}
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
}))