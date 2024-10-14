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
    required: false,
  },
  search_tags: {
    type: String,
    required: false,
  },
  selling_method: {
    type: String,
    require: false,
  },
  information:{
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
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
    required: false,
    default: null
  },

  barcode: {
    type: String,
    required: false,
    default: null
  },

  stock: {
    type: Number,
    required: false,
    default: 0
  },

  stock_notify: {
    type: Number,
    required: false,
    default: 0
  },

  tax: {
    type: Number,
    required: false,
    default: 0
  },

  product_detail_min: {
    type: Number,
    required: false,
    default: 0
  },

  product_detail_max: {
    type: Number,
    required: false,
    default: 0
  },
  increment_value: {
    type: String,
    required: false,
    default: 0
  },

  variant_type: {
    type: String,
    require: false,
    default: null
  },
    variant_value: {
      type: String,
      require: false,
      default: null
  },
  product_weight_type: {
    type: String,
    require: false,
    default: null
  },
  product_weight: {
    type: Number,
    require: false,
    default: 0
  },
  featured: {
    type: Boolean,
    require: [true, 'Please enter a featured'],
    default: false
  },

});

module.exports = mongoose.model('Product', productSchema);
