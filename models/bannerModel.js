const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
    
    name: {
        type: String,
        required: [true, 'Please enter name']
    },

    image: {
        type: String,
        required: [true, 'Please enter image']
    },

    status: {
        type: Boolean,
        required: [true, 'Pleae enter status']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create a virtual property 'id' that's computed from '_id'
bannerSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized.
bannerSchema.set('toJSON', {
    virtuals: true
});
bannerSchema.set('toObject', {
    virtuals: true
});


module.exports = mongoose.model('Banner', bannerSchema);