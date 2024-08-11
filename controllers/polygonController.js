const Polygon = require('../models/polygonModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');

exports.createPolygon = catchAsyncError(async (req, res, next) => {
    console.log(req.body);
    try {
        let {name, status, polygon, image} = req.body;
        const {secure_url} = await cloudinary.uploader.upload(image, {
            folder: 'tomper-wear',
        });
        image = secure_url;
        const newPolygon = await Polygon.create({name, status, polygon, image});
        if(!newPolygon) {
            return next(new ErrorHandler('Server error', 500));
        }
        res.status(200).json({
            success: true,
            data: newPolygon
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
});

exports.getAllPolygon = catchAsyncError(async(req, res, next) => {

    try {
        const polygons = await Polygon.find();
        const data = polygons.map((item, index) => {
            const {
                _id: id,
                name,
                image,
                status, 
                polygon
            } = item;
            const newItem = {
                id,
                name,
                image,
                status,
                polygon
            };
            return newItem;
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
});