const Circle = require('../models/circleModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');

exports.createCircle = catchAsyncError(async (req, res, next) => {
    let {center, radius} = req.body;
    try {
        const circle = await Circle.create({center, radius});
        if(!circle) {
            return next(new ErrorHandler('Server error', 500));
        }
        res.status(200).json({
            success: true,
            data: circle
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
});

exports.getCircle = catchAsyncError(async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: 'chal raha hai bhai'
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
});

