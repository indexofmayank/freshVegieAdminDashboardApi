const mongoose = require('mongoose');

const dealofthedaySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name']
    },

    products: {
        type: [String],
        required: [true, 'Please give atleast one product']
    },

    status: {
        type: Boolean,
        required: [true, 'Please give status']
    }
}, {timestamps: true});

module.exports = mongoose.model('Dealoftheday', dealofthedaySchema);