const DeliveryInstructions = require('../models/deliveryInstructionsModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');


exports.createDeliveryInstructions = catchAsyncError (async (req, res, next) => {
    try {
        const {minimumcart_amount, delivery_charges, initial_rewardpoint} = req.body;
        const deliveryInstructions = await DeliveryInstructions.create({minimumcart_amount, delivery_charges, initial_rewardpoint});
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
                    minimumcart_amount: {$ifNull: ["$minimumcart_amount", "N/a"]},
                    delivery_charges: {$ifNull: ["$delivery_charges" , "N/a"]},
                    initial_rewardpoint: {$ifNull: ["$initial_rewardpoint", "N/a"]},
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

exports.getDeliveryInstructionsById = catchAsyncError (async (req, res, next) => {
    try {
        if(!req.params.id) {
            throw new ErrorHandler('Unable to get delivery instructions', 500);
        }
        const result = await DeliveryInstructions.findById(req.params.id);
        if(!result) {
            throw new ErrorHandler('Unable to get delivery instructions', 500);
        }
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
})

