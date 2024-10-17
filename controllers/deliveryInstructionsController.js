const DeliveryInstructions = require('../models/deliveryInstructionsModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');


exports.createDeliveryInstructions = catchAsyncError (async (req, res, next) => {
    try {
        console.log(req.body);
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
    let staticId = '';
    if(process.env.ENV_MODE === 'development') {
        staticId = '67111410d6f98ff3578a8c92'
    }

    try {
        const result = await DeliveryInstructions.findById(staticId);
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
});

// exports.updateDeliveryInstructions = catchAsyncError (async (req, res, next) => {

//     const staticId = '670ac17222aa50ab5514bd25';
//     const {
//         minimumcart_amount,
//         delivery_charges,
//         initial_rewardpoint
//     } = req.body;
//     try {
//         const delivery_instructions = await DeliveryInstructions.findById(staticId);
//         if(!delivery_instructions) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'server error'
//             });
//         }

//         delivery_instructions.minimumcart_amount = req.body.minimumcart_amount;
//         delivery_instructions.delivery_charges = req.body.delivery_charges;
//         delivery_instructions.initial_rewardpoint = req.body.initial_rewardpoint;

//         const result = await delivery_instructions.save({validateBeforeSave: false});
//         if (!result) {
//             throw new ErrorHandler('Not able to update');
//           }

//         console.log(result);
        
//         return res.status(200).json({
//             success: true,
//             data: 'Update successfully'
//         });
       
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Server error'
//         })
//     }

// });

// exports.updateDeliveryInstructions = catchAsyncError (async (req, res, next) => {
//     try {
//         const updateData = req.body;
//         // const staticId = '67111410d6f98ff3578a8c92';

//         const updatedDeliveryInstructions = await DeliveryInstructions.findOneAndUpdate(
//             // {staticId},
//             // {$set: {'delivery_charges': updateData.delivery_charges, 'minimumcart_amount': updateData.minimumcart_amount, 'initial_rewardpoint': updateData.initial_rewardpoint}},
//             {$set: updateData},
//             {new: false, runValidators: false}
//         );

//         if(!updatedDeliveryInstructions) {
//             return res.status(404).json({
//                 message: 'Delivery instruction not found'
//             });
//         }

//         console.log(updatedDeliveryInstructions);

//         return res.status(200).json({   
//             success: true,
//             message: 'Updated successfully'
//         });
//     } catch (error) {
//         res.status(200).json({
//             success: false,
//             message: 'Server error',
//             error: error.message
//         })
//     }
// });

exports.updateDeliveryInstructions = catchAsyncError (async (req, res, next) => {
    console.log('we come here');
    try {
        const updatedData = req.body;
        if(process.env.ENV_MODE === 'development') {
            staticId = '67111410d6f98ff3578a8c92'
        }

        const updateDeliveryInstructions = await DeliveryInstructions.findByIdAndUpdate(
            staticId,
            {$set: updatedData},
            {new: false, runValidators: false}
        );

        if(!updateDeliveryInstructions) {
            return res.status(200).json({
                message: 'Delivery instructions not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Updated successfully'
        });

    } catch (error) {
        res.status(200).json({
            success: false,
            message: 'Server error',
            error: error.message
        })
    }
})

