const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter product name'],
  },
  category: {
    type: String,
    require: [true, 'Please enter the product category'],
  },
  add_ons: {
    type: String,
    required: [true, 'Please enter the add ons'],
  }, 
  search_tags: {
    type: String,
    required: [true, 'Please enter a search tag'],
  },
  selling_method: {
    type: String,
    require: [true, 'Please enter a selling method'],
  },
  description: {
    type: String,
    required: [true, 'Please enter product description'],
  },
  price: {
    type: Number,
    required: [true, 'Please enter product price'],
    maxLength: [8, 'Price cannot exceed 8 characters'],
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  
  sku: {
    type: String,
    required: [true, "Please enter a sku"]
  },

  barcode: {
    type: String,
    required: [true, 'please enter a barcode']
  },

  stock: {
    type: String,
    required: [true, 'Please enter a stock'],
  },

  stock_notify: {
    type: String,
    required: [true, 'Please enter a stock notify'],
  },

  tax: {
    type: String,
    required: [true, 'Please enter a tax'],
  },

  product_detail_min: {
    type: String,
    required: [true, 'Please enter a product detail min']
  },

  product_detail_max: {
    type: String,
    required: [true, 'Please enter a product detail max']
  }

});

module.exports = mongoose.model('Product', productSchema);
