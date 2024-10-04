const DeliveryInstructions = require('../models/deliveryInstructionsModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');


exports.createDeliveryInstructions = catchAsyncError (async (req, res, next) => {
    try {
        const {name, status, total_distance, surge_fee} = req.body;
        const deliveryInstructions = await DeliveryInstructions.create({name, status, total_distance, surge_fee});
        if(!deliveryInstructions) {
            return next(new ErrorHandler('Server error', 500));
        }
        return res.status(200).json({
            success: true,
            message: 'created succeessfully',
            data: deliveryInstructions
        });
    } catch (error) {
        throw new ErrorHandler('Unable to create delivery instructions', 500);
    }
});

exports.getDeliveryInstructionsForTable = catchAsyncError(async (req, res, next) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const result = await DeliveryInstructions.aggregate([
            {
                $project: {
                    name: {$ifNull: ["$name", "N/a"]},
                    status: {$ifNull: ["$status" , "N/a"]},
                    total_distance: {$ifNull: ["$total_distance", "N/a"]},
                    surge_fee: {$ifNull: ["$surge_fee", "N/a"]}
                }
            },
            {$sort: {createdAt: -1}},
            {$skip: skip},
            {$limit: limit}
        ]);

        return res.status(200).json({
            success: true,
            page,
            limit,
            totalInstructions: result.length,
            totalPage: Math.ceil(result.length / limit),
            data: result
        });
    } catch (error) {
        throw new ErrorHandler('Unable to get delivery instruction table', 500);
    }
});

exports.getDeliveryInstructions = catchAsyncError (async (req, res, next) => {
    try {
        const result = await DeliveryInstructions.find();
        if(!result) {
            return next(new ErrorHandler('Delivery instructions Not Found', 200));
        }
          return res.status(200).json({
            success: true,
            data: result
        })
    } catch (error) {
        throw new ErrorHandler('Unable to get delivery instructions', 500);
    }
});

