const mongoose = require('mongoose');
const Product = require('../models/productModel');


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    image: {
        type: String,
        required: [true, 'Please enter category']
    },
    status: {
        type: Boolean,
        required: [true, 'Please enter status']
    },
    order: {
        type: Number,
        required: [true, 'Please enter order']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

categorySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

categorySchema.set('toJSON', {
    virtuals: true
});
categorySchema.set('toObject', {
    virtuals: true
});

categorySchema.pre('remove', async function(next) {
    try {
        await Product.deleteMany({category: this._id});
        next();
    } catch (error) {
        next(err);
    }
});

module.exports = mongoose.model('Category', categorySchema);
