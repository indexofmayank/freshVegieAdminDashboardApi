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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    try {
        const polygons = await Polygon.aggregate([
            {
                $project : {
                    name: 1,
                    image: 1,
                    status: 1,
                }
            },
            {$sort: {name: 1}},
            {$skip: skip},
            {$limit: limit}
        ]);
        const totalPolygons = await Polygon.countDocuments();
        res.status(200).json({
            success: true,
            page,
            limit,
            totalPage: Math.ceil(totalPolygons / limit),
            totalPolygons,
            data: polygons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });

    }
});

exports.updatePolygon = catchAsyncError(async(req, res, next) => {
    try {
        const {polygonId} = req.params
        let updateData = req.body;
        const {secure_url} = await cloudinary.uploader.upload(updateData.image, {
            folder: 'tomper-wear'
        });
        updateData.image = secure_url;
        const result = await Polygon.findByIdAndUpdate(polygonId, updateData, {new: true});
        if(!result) {
            return res.status(500).json({
                success: false,
                message: 'Server error'
            });
        } else {
            try {
                const udpatedPolygon = await Polygon.findById(polygonId);
                if(!udpatedPolygon) {
                    return res.status(500).json({
                        success: false,
                        message: 'Server error',
                        error: error.message
                    });
                }   
                return res.status(200).json({
                    success: true,
                    data: udpatedPolygon
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Server error',
                    error: error.message
                });
            }
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

exports.deletePolygon = catchAsyncError(async (req, res, next) => {
    if(!req.params.polygonId) {
        return next(new ErrorHandler('Polygon not found', 400));
    }
    try {
        const polygon = await Polygon.findById(req.params.polygonId);
        if(!polygon) {
            return next(new ErrorHandler('Polygon not found', 200));
        }
        await polygon.remove();
        res.status(200).json({
            success: true,
            message: 'Polygon deleted'
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
});

exports.getPolygonById = catchAsyncError(async (req, res, next) => {
    try {
        if(!req.params.polygonId) {
            return next(new ErrorHandler('Polygon not found', 400));
        }
        const polygon = await Polygon.findById(req.params.polygonId);
        if(!polygon) {
            return next(new ErrorHandler('Polygon not found', 200));
        }
        res.status(200).json({
            success: true,
            data: polygon
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
}); 