const Banner = require('../models/bannerModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');

exports.createBanner = catchAsyncError(async (req, res, next) => {
    let { name, image, status,redirect_to,specific_product,specific_category } = req.body;
    try {
        const { secure_url } = await cloudinary.uploader.upload(image, {
            folder: 'tomper-wear',
        });
        image = secure_url;
        const category = await Banner.create({ name, image, status,redirect_to,specific_product,specific_category });
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

exports.getBannerById = catchAsyncError(async(req, res, next) => {
    try {
        if(!req.params.bannerId) {
            return next(new ErrorHandler(`Banner not found`, 400));
        }
        const banner = await Banner.findById(req.params.bannerId);
        if(!banner) {
            return next(new ErrorHandler('Banner not found', 200));
        }
        res.status(200).json({
            success: true,
            data: banner
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
                status,
                redirect_to,
                specific_product,
                specific_category 
            } = item;
            const newItem = {
                id,
                name,
                image,
                status,
                redirect_to,
                specific_product,
                specific_category 
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
        let updateData = req.body;
        const {secure_url} = await cloudinary.uploader.upload(updateData.image, {
            folder: 'tomper-wear'
        });
        updateData.image = secure_url;
        const result = await Banner.findByIdAndUpdate(bannerId, updateData, {new: false});
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

exports.deleteBanner = catchAsyncError(async (req, res, next) => {
    if(!req.params.bannerId) {
        return next(new ErrorHandler('Banner not found', 400));
    }
    try {
        const banner = await Banner.findById(req.params.bannerId);
        if(!banner) {
            return next(new ErrorHandler('Banner not found', 200));
        }
        await banner.remove();
        res.status(200).json({
            success: true,
            message: 'Banner deleted'
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
});

exports.getBannerAcitveStatus = catchAsyncError(async (req, res, next) => {
    try {
        const banners = await Banner.find({status: true});
        res.status(200).json({
            success: true,
            data: banners
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
});

