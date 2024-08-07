const Banner = require('../models/bannerModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');

exports.createBanner = catchAsyncError(async (req, res, next) => {
    let {name, image, status} = req.body;
    const {secure_url} = await cloudinary.uploader.upload(image, {
        folder: 'tomper-wear',
    }); 
    image = secure_url;
    const category = await Banner.create({name, image, status});
    if(!category) {
        return next(new ErrorHandler('Server error', 500));
    }
    res.status(200).json({
        success: true,
        data: category
    });
});


exports.getAllBanner = catchAsyncError(async (req, res, next) => {
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
});
