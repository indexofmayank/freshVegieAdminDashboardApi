const Category = require('../models/categoryModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');

exports.createCategory = catchAsyncError(async(req, res, next) => {
    let {name, image, status} = req.body;
    const {secure_url} = await cloudinary.uploader.upload(image, {
        folder: 'tomper-wear',
    });
     image = secure_url;
     const category = await Category.create({name, status, image});
     if(!category) {
        return next(new ErrorHandler('Server error', 500));
     }
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
    try {
        const {categoryId} = req.params;
        let updateData = req.body;
        const {secure_url} = await cloudinary.uploader.upload(updateData.image, {
            folder: 'tomper-wear'
        });
        updateData.image = secure_url;
        const result = await Category.findByIdAndUpdate(categoryId, updateData, {new: true});
        if(!result) {
            return res.status(500).json({
                success: false,
                message: 'Server error',
            });
        } else {
            try {
                const updatedCategory = await Category.findById(categoryId);
                if(!updatedCategory) {
                    return res.status(500).json({
                        success: false,
                        message: 'Server error',
                        error: error.message
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: updatedCategory
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
        res.status(500).json({success: false, message: 'Server error', error: error.message});                       
    }
});