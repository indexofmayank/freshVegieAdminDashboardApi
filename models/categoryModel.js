const mongoose = require('mongoose');

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
        type: String,
        enum: ['active', 'inactive'],
        required: [true, 'Please enter status']
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create a virtual property 'id' that's computed from '_id'
categorySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized.
categorySchema.set('toJSON', {
    virtuals: true
});
categorySchema.set('toObject', {
    virtuals: true
});

module.exports = mongoose.model('Category', categorySchema);
