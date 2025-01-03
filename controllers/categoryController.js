const Category = require('../models/categoryModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const { createObjectCsvWriter, createObjectCsvStringifier } = require('csv-writer');

exports.createCategory = catchAsyncError(async(req, res, next) => {
    let {name, image, status, order} = req.body;
    const {secure_url} = await cloudinary.uploader.upload(image, {
        folder: 'tomper-wear',
    });
     image = secure_url;
     const category = await Category.create({name, status, image, order});
     if(!category) {
        return next(new ErrorHandler('Server error', 500));
     }
    res.status(200).json({
        success: true,
        data: category
    });
});

exports.getAllCategroy = catchAsyncError(async(req, res, next) => {
    const categories = await Category.find({status: true}).sort({ order: 1 });

    // const categories = await Category.aggregate([
    //     {
    //         $project: {
    //             name: {$ifNull: ['$name', 'N/a']},
    //             image: {$ifNull: ['$image', 'N/a']}
    //         }
    //     }
    // ]);
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
        console.log(updateData);
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

exports.getAllCategoriesForTable = catchAsyncError(async (req, res, next) => {

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const categories = await Category.aggregate([
            {
                $project: {
                    name: 1,
                    image: 1,
                    status: 1,
                    order: 1
                }
            },
            {
                $sort: { name: 1 },
            },
            {$sort : {order: 1}},
            {$skip: skip},
            {$limit: limit},    
        ]);
    
        const totalCategories = await Category.countDocuments();
        res.status(200).json({
            success: true,
            page,
            limit,
            totalCategories,
            totalPages: Math.ceil(totalCategories / limit),
            data: categories
        });
    } catch (error) {
        console.error('Error : ', error);
        res.status(500).json({
          error: 'Something wrong happend'
        });    
    }
});

exports.getAllCategoryByName = (catchAsyncError(async (req, res, next) => {
    try {
        const categoriesName = await Category.aggregate([
            // {
            //     $match: {'status': 'true'}
            // },
            {
                $project: {
                    name: {$ifNull: ["$name", "N/A"]}
                }
            },
            {$sort: {order: -1}}
        ]);

        return res.status(200).json({
            success: true,
            data: categoriesName
        });

    } catch (error) {
        console.error('Error: ', error);
        error: 'Something went wrong';
    }
}));

exports.getAllCategoryExportCSV = catchAsyncError(async(req, res, next) => {
try {
        const categories = await Category.find();
        // Define CSV writer
        const csvStringifier = createObjectCsvStringifier({
            // path: csvFilePath,
            header: [
                { id: '_id', title: 'ID' },
                { id: 'name', title: 'Name' },
                { id: 'image', title: 'Image' },
                { id: 'status', title: 'Status' },
                { id: 'order', title: 'Order' },
                { id: 'createdAt', title: 'Created At' },
                { id: 'updatedAt', title: 'Updated At' }
            ]
          });

          const records = [];
          // console.log(Orders.orderItems);
          categories.forEach(category => {
              records.push({
                _id: category._id.toString(),
                name: category.name,
                image: category.image,
                status: category.status,
                order: category.order,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
              });
          });

        // Write data to CSV
        const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

            // Send CSV as response
            res.header('Content-Type', 'text/csv');
            res.attachment('category.csv');
            res.send(csvContent);
            console.log('Categories exported successfully to categories.csv');
        } catch (err) {
            console.error('Error exporting categories:', err);
            // process.exit(1);
        }
});


