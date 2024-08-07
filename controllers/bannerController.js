const Banner = require('../models/bannerModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');

exports.createBanner = catchAsyncError(async (req, res, next) => {
    let { name, image, status } = req.body;
    try {
        const { secure_url } = await cloudinary.uploader.upload(image, {
            folder: 'tomper-wear',
        });
        image = secure_url;
        const category = await Banner.create({ name, image, status });
        if (!category) {
            return next(new ErrorHandler('Server error', 500));
        }
        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Serve error', error: error.message });
    }
});


exports.getAllBanner = catchAsyncError(async (req, res, next) => {
    try {
        const banners = await Banner.find();
        const data = banners.map((item, index) => {
            const {
                _id: id,
                name,
                image,
                status
            } = item;
            const newItem = {
                id,
                name,
                image,
                status
            };
            return newItem;
        });
        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

exports.updateBanner = catchAsyncError(async (req, res, next) => {
    try {
        const { bannerId } = req.params;
        const updateData = req.body;
        const result = await Banner.findByIdAndUpdate(bannerId, updateData, {new: false});
        console.log('mayank');
        if(!result) {
            return res.status(500).json({success: false, message: 'Server error'});
        } else {
            try {
                const updatedBanner = await Banner.findById(bannerId);
                if(!updatedBanner) {
                    return res.status(500).json({success: false, message: 'Server error', error: error.message});
                }
                return res.status(200).json({
                    success: true,
                    data: updatedBanner
                });
            } catch (error) {
                res.status(500).json({success: false, message: 'Server error', error: error.message});
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});
