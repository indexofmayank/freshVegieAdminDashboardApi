const mongoose = require('mongoose');

const dealofthedaySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name']
    },

    products: {
        type: [String],
        required: [true, 'Please give atleast one product']
    }
});

module.exports = mongoose.model('Dealoftheday', dealofthedaySchema);