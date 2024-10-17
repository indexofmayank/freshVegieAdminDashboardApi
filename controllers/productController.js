const Product = require('../models/productModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// create a new product
exports.createProduct = catchAsyncError(async (req, res, next) => {
  req.body.admin = req.user.id;
  let images = req.body.images;
  let newImages = [];
  for (let i = 0; i < images.length; i++) {
    const { public_id, secure_url } = await cloudinary.uploader.upload(images[i], {
      folder: 'tomper-wear',
    });
    newImages.push({ public_id, secure_url });
  }
  req.body.images = [...newImages];
  const product = await Product.create(req.body);
  res.status(200).json({
    success: true,
    data: product,
  });
});

// update an existing product
exports.updateProduct = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product Not Found', 400));
  }
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product Not Found', 200));
  }
  let images = req.body.images;
  let newImages = [];
  for (let i = 0; i < images.length; i++) {
    if (typeof images[i] === 'string') {
      const { public_id, secure_url } = await cloudinary.uploader.upload(images[i], {
        folder: 'tomper-wear',
      });
      newImages.push({ public_id, secure_url });
    } else {
      newImages.push(images[i]);
    }
  }
  req.body.images = [...newImages];
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    product,
  });
});

// delete an existing product
exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product Not Found', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product Not Found', 200));
  }
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.uploader.destroy(product.images[i].public_id);
  }
  await product.remove();
  res.status(200).json({
    success: true,
    message: 'Product deleted',
  });
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 10;
  // const skip = (page - 1) * limit;
  try {
    const products = await Product.aggregate([
      // {
      //   $lookup: {
      //     from: 'categories',
      //     localField: 'category',
      //     foreignField: '_id',
      //     as: 'categoryDetails'
      //   }
      // },
      // {
      //   $unwind: {
      //     path: '$categoryDetails',
      //     preserveNullAndEmptyArrays: true 
      //   }
      // },
      {
        $project : {
          name: 1,
          category: 1,
          add_ons: 1,
          search_tags: 1,
          selling_method: 1,
          information: 1,
          description: 1,
          price: 1,
          offer_price: 1,
          purchase_price: 1,
          images: 1,
          sku: 1,
          barcode: 1,
          stock: 1,
          stock_notify: 1,
          tax: 1,
          product_detail_min: 1,
          product_detail_max: 1,
          increment_value: 1,
          variant_type: 1,
          variant_value: 1,
          product_weight_type: 1,
          product_weight: 1,
          featured:1,
        }
      },
      {$sort: {name: 1}},
      // {$skip: skip},
      // {$limit: limit}
    ]);
    const totalProducts = await Product.countDocuments();
    res.status(200).json({
      success: true,
      // page,
      // limit,
      // totalPage: Math.ceil(totalProducts / limit),
      // totalProducts,
      data: products
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// send all product details
exports.getAllProductForTable = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const products = await Product.aggregate([
    {
      $lookup: {
        from: 'categories', // Collection name for Category
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    {
      $unwind: '$categoryDetails', // Unwind to extract category details as a single object
    },
    {
      $project: {
        name: 1,
        category: '$categoryDetails.name', // Project the category name instead of the ObjectId
        add_ons: 1,
        search_tags: 1,
        selling_method: 1,
        description: 1,
        price: 1,
        offer_price: 1,
        stock: 1,
        image: { $arrayElemAt: ['$images.secure_url', 0] },
        product_status: 1
      },
    },
    {
      $sort: { name: 1 },
    },
    {$skip: skip},
    {$limit: limit},
  ]);

  const totalProducts = await Product.countDocuments();
  
  res.status(200).json({
    success: true,
    page,
    limit,
    totalPage: Math.ceil(totalProducts / limit),
    totalProducts,
    data: products,
  });
});

exports.getAllProductForOrder = catchAsyncError(async (req, res, next) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 5;
  // const skip = (page - 1) * limit;
  const products = await Product.aggregate([
    {
      $lookup: {
        from: 'categories', // Collection name for Category
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    {
      $unwind: '$categoryDetails', // Unwind to extract category details as a single object
    },
    {
      $project: {
        name: 1,
        category: '$categoryDetails.name', // Project the category name instead of the ObjectId
        add_ons: 1,
        search_tags: 1,
        selling_method: 1,
        description: 1,
        price: 1,
        offer_price: 1,
        stock: 1,
        information:1,
        increment_value:1,
        product_detail_min:1,
        product_detail_max:1,
        image: { $arrayElemAt: ['$images.secure_url', 0] },
        product_status: 1
      },
    },
    {
      $sort: { name: 1 },
    },
    // {$skip: skip},
    // {$limit: limit},
  ]);

  const totalProducts = await Product.countDocuments();
  
  res.status(200).json({
    success: true,
    totalProducts,
    data: products,
  });
});

// send only a single product detaisl
exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product Not Found', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product Not Found', 200));
  }
  res.status(200).json({
    success: true,
    data: product,
  });
});

// review a product
exports.createProductReview = catchAsyncError(async (req, res, next) => {
  const { rating, comment, productId, name, email } = req.body;
  if (!rating || !comment || !productId || !name || !email) {
    return next(new ErrorHandler('Request invalid', 400));
  }
  // creating a review
  const review = {
    name,
    email,
    rating: Number(rating),
    comment,
  };
  const product = await Product.findById(productId);
  // check if the user already reviewed
  const isReviewed = product.reviews.some((rev) => rev.email === email);
  // user already review: update the review
  // user gives new review: add new review and update the number of reviews
  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.email === email) {
        rev.name = name;
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }
  // update product rating
  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  avg = avg / product.reviews.length;
  product.rating = avg;
  // save the product
  await product.save({ validateBeforeSave: false });
  // send success response
  res.status(200).json({
    success: true,
    message: 'Product review created',
  });
});

// send all product reviews
exports.getAllReviews = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product not found', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product not found', 200));
  }
  const reviews = product.reviews;
  res.status(200).json({
    success: true,
    data: reviews,
  });
});

// delete product review
exports.deleteReview = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product not found', 400));
  }
  const { reviewId } = req.body;
  if (!reviewId) {
    return next(new ErrorHandler('Review not found', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product not found', 200));
  }
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== reviewId.toString()
  );
  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });
  avg = avg / reviews.length;
  const rating = avg || 0;
  const numberOfReviews = reviews.length;
  await Product.findByIdAndUpdate(
    req.params.id,
    {
      rating,
      numberOfReviews,
      reviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    }
  );
  res.status(200).json({
    success: true,
    message: 'Review deleted',
  });
});

exports.getProductByCategory = catchAsyncError( async (req, res, next) => {
  const {categoryId} = req.params;
  if(!categoryId) {
    return next(new ErrorHandler('Category not found', 400));
  }
  const products = await Product.find({category: categoryId});
  if(!products) {
    return next(new ErrorHandler('Product not found', 200));
  }
  res.status(200).json({
    success: true,
    data: products
  });
});

exports.updateManyProducts = catchAsyncError(async (req, res, next) => {
  const {updatedProducts} = req.body;
  try {
    const bulkOps = updatedProducts.map((product) => ({
      updateOne: {
        filter: {_id: product._id},
        update: {
          $set: {
            stock: product.stock,
            stock_notify: product.stock_notify,
            price: product.price,
            offer_price: product.offer_price
          },
        },
      },
    }));
    await Product.bulkWrite(bulkOps);
    res.status(200).json({message: 'Bulk update successfully'});
  } catch (error) {
    console.error('Error updating inventory: ', error);
    res.status(500).json({
      error: 'Bluk update failed'
    });
  }

});

exports.getProductByIdForAdmin = catchAsyncError (async (req, res, next) => {
  console.log('we hit here');
  try {
    const productId = req.params.id;
    console.log(productId);
    if(!productId) {
      throw new ErrorHandler('product id not defined')
    }
    const product = await Product.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(productId)}
      },
      {
        $lookup: {
          from: 'categories', // Collection name for Category
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      {
        $unwind: '$categoryDetails', // Unwind to extract category details as a single object
      },
      {
        $project : {
          name: 1,
          category: '$categoryDetails.name', // Project the category name instead of the ObjectId
          add_ons: 1,
          search_tags: 1,
          selling_method: 1,
          information:1,
          description: 1,
          price: 1,
          offer_price: 1,
          purchase_price: 1,
          images: {$arrayElemAt: ['$images.secure_url', 0]},
          sku: 1,
          barcode: 1,
          stock: 1,
          stock_notify: 1,
          tax: 1,
          product_status: 1,
          product_detail_min: 1,
          product_detail_max: 1,
          increment_value: 1,
          featured: 1
        }
      },
    ]);
    res.status(200).json({
      success: true,
      data: product
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
  });
}

});

exports.getProductDetailByIdForUpdate = catchAsyncError (async (req, res, next) => {
  try {
    const productId = req.params.id;
    if(!productId) {
      throw new ErrorHandler('Product not found', 400);
    }
    const product = await Product.findById({_id: productId});
    console.log(product);
    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'error while getting product',
      error: error.message
    })
  }
});

exports.getProductForDropdown = catchAsyncError (async (req, res, next) => {
  try {
    const {name, category} = req.query;
    console.log(name, category);
    const matchCriteria = {};
    if(name) {
      matchCriteria.name = {$regex: name, $options: 'i'}
    }
    if(category) {
      matchCriteria.category = mongoose.Types.ObjectId(category);
    }
    const productListForDropdown = await Product.aggregate([
      {
       $match: matchCriteria
      },
      {
        $project: {
          name: {$ifNull: ['$name', 'N/A']}
        }
      },
      {
        $sort: {name: 1}
      }
    ]);
    return res.status(200).json({
      success: true,
      data: productListForDropdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'error while getting product',
      error: error.message
    });
  }
});

exports.getProductDropdownForCreateOrder = catchAsyncError(async (req, res, next) => {
  try {
    const { name } = req.query;
    const matchCondition = name ? { "name": { $regex: name, $options: "i" } } : {};

    const Products = await Product.aggregate([
      {
        $match: matchCondition
      },
      {
        $project: {
          name: { $ifNull: ["$name", "N/A"] }, 
          image: { $ifNull: ["$images.secure_url", "N/A"] },
          offer_price: {$ifNull: ["$offer_price", "N/A"]},
          price: {$ifNull: ["$price", "N/A"]},
          product_detail_min: {$ifNull: ["$product_detail_min", "N/a"]},
          product_detail_max: {$ifNull: ["$product_detail_max", "N/a"]},
          increment_value: {$ifNull: ["$increment_value", "N/a"]},
          information: {$ifNull: ["$information", "N/a"]}
        },
      }
    ]);
    return res.status(200).json({
      success: true,
      data: Products,
    });

  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong while getting dropdown');
  }
});


exports.getActiveProductNameForDropdown = catchAsyncError(async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      {
        $match: {'product_status' : true}
      },
      {
        $project: {
          name: {$ifNull: ["$name", "N/a"]}
        }
      }
    ]);
    return res.status(200).json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong while getting the dropdown');
  }
});