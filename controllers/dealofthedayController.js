const Dealoftheday = require('../models/dealofthedayModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

exports.createDealoftheday = catchAsyncError(async (req, res, next) => {
    try {
        let { name, products, status } = req.body;
        const response = await Dealoftheday.create({ name, products, status });
        if (!response) {
            return res.status(500).json({
                success: false,
                message: 'Something went wrong while creating deal of the day'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Created successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'server error'
        });
    }
});

exports.getAllDealOfTheDayForTable = catchAsyncError(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const deals = await Dealoftheday.aggregate([
            {
                $addFields: {
                    timestampFormatted: {
                        $dateToString: {
                            format: "%d %B %Y, %H:%M:%S",
                            date: "$createdAt",
                            timezone: 'UTC'
                        }
                    }
                }
            },
            {
                $project: {
                    name: { $ifNull: ["$name", 'N/a'] },
                    status: { $ifNull: ["$status", 'N/a'] },
                    timestampFormatted: { $ifNull: ["$timestampFormatted", "N/a"] }
                }
            }
        ])
        return res.status(200).json({
            success: true,
            data: deals
        });
    } catch (error) {
        throw new ErrorHandler('Something went wrong while getting the deal of the day');
    }
});

exports.getAllFeaturedProductForTable = catchAsyncError(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const featuredStatus = true; 
        const result = await Product.aggregate([
            {
                $match: {
                    featured: featuredStatus 
                }
            },
            {
                $facet: {
                    featuredProducts: [
                        // {
                        //     $skip: skip 
                        // },
                        // {
                        //     $limit: limit 
                        // },
                        {
                            $project: {
                                name: { $ifNull: ["$name", "N/a"] },
                                image: {$arrayElemAt: ['$images.secure_url', 0]},
                            }
                        }
                    ],
                    totalCount: [
                        {
                            $count: "count" 
                        }
                    ]
                }
            }]);

        // Extracting results
        const featuredProducts = result[0].featuredProducts;
        const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

        console.log("Featured Products:", featuredProducts);
        console.log("Total Count of Matched Documents:", totalCount);
        res.status(200).json({
            success: true,
            page,
            limit,
            totalPage: Math.ceil(totalCount / limit),
            totalCount,
            data: featuredProducts
        });
    } catch (error) {
        throw new ErrorHandler('Something went wrong while getting the featured product');
    }
});

exports.updateDealOfTheDay = catchAsyncError (async (req, res, next) => {
    try {
        if(!req.params.id) {
            throw new ErrorHandler('Product not found', 500);
        }
        const product = await Product.findById(req.params.id);
        console.log(product);
        if(!product) {
            return next(new ErrorHandler('Product not found', 200));
        }
        product.featured = 'false';
        const result = await product.save({validateBeforeSave: false});
        if(!result) {
            throw new ErrorHandler('Not able to update');
        }
        res.status(200).json({
            success: true,
            message: 'Deal of the day updated successfully'
        });
    } catch (error) {
        throw new ErrorHandler('Something went wrong while updating the deal of the day');
    }
});

exports.getDealOfTheDayById = catchAsyncError(async (req, res, next) => {
    try {
        const deal = await Product.aggregate([
            {
                $match: {_id: mongoose.Types.ObjectId(req.params.id)}
            },
            {
                $project: {
                    name: 1,
                    featured: 1,
                    images: {$arrayElemAt: ['$images.secure_url', 0]},
                }
            }
        ]);
        console.log(deal);

        res.status(200).json({
            success: true,
            data: deal
        });

    } catch (error) {
        throw new ErrorHandler('Something went wrong while getting the deal of the day');
    }
});

exports.getFeaturedProductByName = catchAsyncError(async (req, res, next) => {
    
    console.log('we came here');
    const session = await mongoose.startSession();
    const {name} = req.body;
    console.log(name);``
    const matchCondition = name ? {"name" : {$regex: name, $options: "i" }}: {};

    try {
        const products = await Product.aggregate([
            {
                $match: matchCondition
            },
            {
                $project: {
                    name: {$ifNull: ["$name", "N/a"]}
                }
            },
            {
                $sort: {createdAt: -1}
            }
        ], {session});

        if(!products) {
            return res.status(200).json({
                success: false,
                message: 'Not able to get product by name'
            });
        }
    
        return res.status(200).json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something went wrong while fetching featured product by name');
    } finally {
        session.endSession();
    }

});


exports.getFeaturedProductDropdown = catchAsyncError(async (req, res, next) => {


    try {
        // const product = await Product.aggregate([

        // ]);

        return res.status(200).json({
            success: true,
            message: 'its working'
        });

    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something went wrong while fetching featured Product By Dropdown');
    }
});

exports.updateDealOfTheDayWithBody = catchAsyncError(async (req, res, next) => {
    console.log(req.body);
    try {
        if (!req.params.id) {
            return next(new ErrorHandler('Product ID not provided', 400)); 
        }

        const { featured } = req.body; 

        if (typeof featured !== 'boolean') {
            return next(new ErrorHandler('Invalid featured value', 400)); 
        }

        const result = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { featured } }, 
            {
                new: true, 
                upsert: true, 
            }
        );

        console.log(result);

        res.status(200).json({
            success: true,
            message: result.isNew
                ? 'New product created and marked as deal of the day'
                : 'Deal of the day updated successfully',
        });
    } catch (error) {
        console.error(error);
        next(new ErrorHandler('Something went wrong while updating the deal of the day', 500));
    }
});
