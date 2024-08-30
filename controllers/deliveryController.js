const Admin = require('../models/adminModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');


exports.getDeliveryPartnerByName = (catchAsyncError( async (req, res, next) => {
    try {
        const deliveryPartnersName = await Admin.aggregate([
            {
                $match: { 'privilege' : 'delivery_partner'}
            },
            {
                $project: {
                    name: {$ifNull: ["$name", "N/A"]}
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            data: deliveryPartnersName
        });
    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something went wrong while getting delivery partner name');
    }
}));

exports.getDeliveryPartnerDetailById = (catchAsyncError (async (req, res, next) => {
    try {
        const {partnerId} = req.params;
        const deliveryPartnerDetail = await Admin.aggregate([
            {
                $match: {_id: mongoose.Types.ObjectId(partnerId)}
            }, 
            {
                $project: {
                    name: {$ifNull: ["$name", "N/A"]},
                    phone: {$ifNull: ["$phone", "N/A"]},
                    email: {$ifNull: ["$email", "N/A"]}
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: deliveryPartnerDetail[0]
        });
    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something went wrong while getting delivery partner detail');
    }
}));