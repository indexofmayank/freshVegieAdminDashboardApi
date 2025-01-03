const Product = require('../models/productModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');

exports.getAllProductsForInventory = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const categoryId = req.query.category || null;
  const productId = req.query.product || null;
  const skip = (page - 1) * limit;

  if(categoryId !== null) {
    const products = await Product.aggregate([
      {
        $match: {category: mongoose.Types.ObjectId(categoryId)}
      },  
      {
        $project: {
          name: 1,
          image: { $arrayElemAt: ["$images.secure_url", 0] },
          stock: 1,
          price: 1,
          offer_price: 1,
          stock_notify: 1,  
          purchase_price: 1,
        }
      },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    const totalProducts = await Product.countDocuments({category: mongoose.Types.ObjectId(categoryId)});
    // console.log(totalProducts);
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      data: products
    });
  }

  if(productId !== null) {
    const products = await Product.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(productId)}
      },
      {
        $project: {
          name: 1,
          image: { $arrayElemAt: ["$images.secure_url", 0] },
          stock: 1,
          price: 1,
          offer_price: 1,
          stock_notify: 1,
          purchase_price: 1,
        }
      },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    const totalProducts = await Product.countDocuments({_id: mongoose.Types.ObjectId(categoryId)});
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      data: products
    });
  }

  const products = await Product.aggregate([
    {
      $project: {
        name: 1,
        image: { $arrayElemAt: ["$images.secure_url", 0] },
        stock: 1,
        price: 1,
        offer_price: 1,
        stock_notify: 1,
        purchase_price: 1,
      }
    },
    { $sort: { name: 1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
  const totalProducts = await Product.countDocuments();
  return res.status(200).json({
    success: true,
    page,
    limit,
    totalPages: Math.ceil(totalProducts / limit),
    totalProducts,
    data: products
  });

});

exports.updateProductForInventory = catchAsyncError(async (req, res, next) => {

  // console.log('we hit here');
  try {
    const productsToUpdate = req.body; // Array of products to update

    if (!Array.isArray(productsToUpdate) || productsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No products to update' });
    }

    // Prepare the bulk update operations
    const bulkOperations = productsToUpdate.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            name: product.name,
            stock: product.stock,
            stock_notify: product.stock_notify,
            price: product.price,
            offer_price: product.offer_price,
            purchase_price: product.purchase_price,
          },
        },
      },
    }));

    // Perform the bulk write operation
    const result = await Product.bulkWrite(bulkOperations);
    // console.log(result);

    res.status(200).json({
      success: true,
      message: 'Bulk update successful',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error during bulk update:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }

});

exports.getProductByNameForInventory = (catchAsyncError(async (req, res, next) => {
  try {
    const { name, category } = req.query;
    console.log(category);
    const matchCriteria = {};
    if (name) {
      matchCriteria.name = { $regex: name, $options: 'i' };
    }
    const productsByName = await Product.aggregate([
      {
        $match: matchCriteria
      },
      {
        $project: {
          name: { $ifNull: ['$name', 'N/A'] }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
    // console.log(productsByName);
    return res.status(200).json({
      success: true,
      data: productsByName
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler({ success: false, message: error.message });
  }
}))