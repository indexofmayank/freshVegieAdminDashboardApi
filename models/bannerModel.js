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
        type: String,
        enum: ['true', 'false'],
        required: [true, 'Pleae enter status']
    }
}, {timestamps: true});

module.exports = mongoose.model('Banner', bannerSchema);