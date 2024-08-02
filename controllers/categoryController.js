const Category = require('../models/categoryModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');

exports.createCategory = catchAsyncError(async(req, res, next) => {

    const {name, image} = req.body;
    const category = await Category.create({name, image});

    res.status(200).json({
        success: true,
        data: category
    });
});

exports.getAllCategroy = catchAsyncError(async(req, res, next) => {
    const categories = await Category.find();

    res.status(200).json({
        success: true,
        data: categories
    });
});

exports.getCategoryById = catchAsyncError(async(req, res, next) => {
    if(!req.params.id) {
        return next(new ErrorHandler('Category not found', 400));
    }
    const category = await Category.findById(req.params.id);
    if(!category) {
        return next(new ErrorHandler('Category Not found', 200));
    }
    res.status(200).json({
        success: true,
        data: category
    });
});

exports.deleteCategory = catchAsyncError(async(req, res, next) => {
    if(!req.params.id) {
        return next(new ErrorHandler('Category not found', 400));
    }
    const category = await Category.findById(req.params.id);
    if(!category) {
        return next(new ErrorHandler('Category not found', 200));
    }

    await category.remove();
    res.status(200).json({
        success: true,
        message: 'category deleted'
    });
});

exports.updateCategory = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { name, image } = req.body;

    if (!id) {
        return next(new ErrorHandler('Category ID is required', 400));
    }

    const category = await Category.findById(id);
    if (!category) {
        return next(new ErrorHandler('Category not found', 404));
    }

    category.name = name || category.name;
    await category.save();

    res.status(200).json({
        success: true,
        data: category
    });
});