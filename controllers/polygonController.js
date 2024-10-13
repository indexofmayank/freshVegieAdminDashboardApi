const Polygon = require('../models/polygonModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const pointInPolygon = require('point-in-polygon');
const axios = require('axios');


exports.createPolygon = catchAsyncError(async (req, res, next) => {
    console.log(req.body);
    try {
        let {name, status, polygon, image} = req.body;
        console.log(polygon);
        const polygonData = polygon.map(point => [parseFloat(point.lng), parseFloat(point.lat)]);
        console.log(polygonData);

        const generatePointsWithinPolygon = (polygon) => {
            console.log('we came here inside point with polygon')
            const latitudes = polygon.map(point => parseFloat(point[1]));
            const longitudes = polygon.map(point => parseFloat(point[0]));
            console.log(latitudes);
            console.log(longitudes);
            
            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);
            console.log(minLat);
            console.log(maxLat);
            console.log(minLng);
            console.log(maxLng);
            
            const points = [];
        
            // Iterate through the bounding box of the polygon
            for (let lat = minLat; lat <= maxLat; lat += 0.01) { // Adjust step size for granularity
                for (let lng = minLng; lng <= maxLng; lng += 0.01) {
                    const coords = [lng, lat];
                    console.log(coords)
                    if (pointInPolygon(coords, polygon)) {
                        console.log('got point')
                        points.push({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
                    }
                }
            }
            console.log(points);
            return points;
        };
        const getPincodesForPoints = async (points) => {
            console.log('we came here inside pincode for polygon');
            const pincodes = [];
        
            for (const point of points) {
                const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                    params: {
                        latlng: `${point.lat},${point.lng}`,
                        key: 'AIzaSyCrS9nf-veNDWJi3uw7Opt9d08yqlx3spU' // Replace with your actual API key
                    }
                });
        
        
                const results = response.data.results;
                if (results.length > 0) {
                    const addressComponents = results[0].address_components;
                    const pincodeComponent = addressComponents.find(component => component.types.includes('postal_code'));
                    if (pincodeComponent) {
                        pincodes.push(pincodeComponent.long_name);
                    }
                }
            }
            console.log(pincodes);
            return [...new Set(pincodes)]; // Remove duplicates
        };
        const pointsWithinPolygon = generatePointsWithinPolygon(polygonData);
        const pincodes = await getPincodesForPoints(pointsWithinPolygon);

        
        const {secure_url} = await cloudinary.uploader.upload(image, {
            folder: 'tomper-wear',
        });
        image = secure_url;
        const newPolygon = await Polygon.create({name, status, polygon, image, pincodes});
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

exports.getSimplePolygon = catchAsyncError(async (req, res, next) => {
    try {
        const results = await Polygon.find({'status' : 'true'})
        if(!results) {
            throw new Error('Something went wrong while getting polygon', 400);
        }
        return res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            MessageEvent: 'Server error',
            error: error.message
        });
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

exports.getActivePolygon = catchAsyncError( async (req, res, next) => {
    try {
        const activePolygon = await Polygon.findOne({'status': true});
        if(!activePolygon){
            throw new ErrorHandler('Not found', 400);
        }
        return res.status(200).json({
            success: true,
            data: activePolygon
        });
    } catch (error) {
        console.log('Something went wrong while getting the active polygon');
        throw new ErrorHandler('Something went wrong while getting the polygon', 404);
    }
});