const mongoose = require('mongoose');



const polygonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name'],
    },

    status: {
        type: String,
        required: [true, 'Please enter status'],
    },

    polygon: [
        {
            lat: {
                type: String,
                required: [true, 'Please enter lat']
            },
            lng: {
                type: String,
                required: [true, 'Please enter lng']
            }
        }
    ],

    image: {
        type: String,
        required: [true, 'Please enter image']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

polygonSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

polygonSchema.set('toJSON', {
    virtuals: true
});

polygonSchema.set('toObject', {
    virtuals: true
});

module.exports = mongoose.model('Polygon', polygonSchema);