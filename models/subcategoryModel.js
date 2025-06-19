const mongoose = require('mongoose');
const Product = require('./productModel');

const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please enter the category'],
    },
    image: {
        type: String,
        required: [true, 'Please enter image']
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

subcategorySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

subcategorySchema.set('toJSON', {
    virtuals: true
});
subcategorySchema.set('toObject', {
    virtuals: true
});

subcategorySchema.pre('remove', async function(next) {
    try {
        await Product.deleteMany({category: this._id});
        next();
    } catch (error) {
        next(err);
    }
});

module.exports = mongoose.model('Subcategory', subcategorySchema);
