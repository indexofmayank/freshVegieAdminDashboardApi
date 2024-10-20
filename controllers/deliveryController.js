const Admin = require('../models/adminModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');
const Order = require('../models/orderModel');


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
                    email: {$ifNull: ["$email", "N/A"]},
                    deliveryPartnerId: 1
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

exports.getOrderListByDeliveryPartnerId = catchAsyncError(async (req, res, next) => {
    const deliveryPartnerId = req.params.id;

    try {
        const deliveryPartnerOrderLists = await Order.aggregate([
            {
                $match: {"deliveryInfo.deliveryPartner.deliveryPartnerId" : mongoose.Types.ObjectId(deliveryPartnerId)}
            },
            {
                $project: {
                    orderId: 1,
                    shippingInfo: 1,
                    discountPrice: 1,
                    orderItems: 1,
                    user: 1,
                    paymentInfo: 1,
                    deliveryInfo: 1,
                    shippingPrice: 1,
                    grandTotal: 1,
                    orderStatus: 1,
                    orderFrom: 1
                }
            }
        ]);


        console.log(deliveryPartnerOrderLists);

        if(!deliveryPartnerOrderLists) {
            return res.status(200).json({
                success: false,
                message : "it working"
            });
        }

        return res.status(200).json({
            success: true,
            data: deliveryPartnerOrderLists
        });
    } catch (error) {
       return res.status(500).json({
        success: true,
        error: error.message
       });
    }
})