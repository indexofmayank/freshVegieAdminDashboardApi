const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter product name'],
  },
  product_status: {
    type: Boolean,
    required: [true, 'Please enter product status'],
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please enter the product category'],
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

  offer_price: {
    type: Number,
    required: [true, 'Please enter product offer price']
  },
  purchase_price: {
    type: Number,
    required: [true, 'please enter purchase price']
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      secure_url: {
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
    type: Number,
    required: [true, 'Please enter a stock'],
  },

  stock_notify: {
    type: Number,
    required: [true, 'Please enter a stock notify'],
  },

  tax: {
    type: Number,
    required: [true, 'Please enter a tax'],
  },

  product_detail_min: {
    type: Number,
    required: [true, 'Please enter a product detail min']
  },

  product_detail_max: {
    type: Number,
    required: [true, 'Please enter a product detail max']
  },
  increment_value: {
    type: Number,
    required: [true, 'Please enter a Increment value']
  },

  variant_type: {
    type: String,
    require: [false]
  },
    variant_value: {
      type: String,
      require: [false]
  },
  product_weight_type: {
    type: String,
    require: [false],
    default: 0
  },
  product_weight: {
    type: Number,
    require: [false],
    default: 0
  },
  featured: {
    type: Boolean,
    require: [true, 'Please enter a featured'],
    default: false
  },

});

module.exports = mongoose.model('Product', productSchema);
