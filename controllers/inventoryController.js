const Product = require('../models/productModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');

exports.getAllProductsForInventory = catchAsyncError(async(req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const products = await Product.aggregate([
        {
            $project : {
                name: 1,
                image: {$arrayElemAt: ["$images.secure_url", 0]},
                stock: 1,
                price: 1,
                offer_price: 1,
                stock_notify: 1,
                purchase_price: 1,
            }
        },
        {$sort: {name: 1}},
        {$skip: skip},
        {$limit: limit},
    ]);
    const totalProducts = await Product.countDocuments();
    res.status(200).json({
        success: true,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        data: products
    });
});