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
        console.log('we came here');
        const deal = await Product.aggregate([
            {
                $match: {_id: mongoose.Types.ObjectId(req.params.id)}
            },
            {
                $project: {
                    featured: {$ifNull: ["$featured", "N/a"]}
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
})
