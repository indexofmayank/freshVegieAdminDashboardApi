const Dealoftheday = require('../models/dealofthedayModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');

exports.createDealoftheday = catchAsyncError (async (req, res, next) => {
    try {
        let {name, products} = req.body;
        const response = await Dealoftheday.create({name, products});
        if(!response) {
            return res.status(500).json({
                success: false,
                message: 'Something went wrong while creating deal of the day'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'server error'
        });
    }
});

