const mongoose = require('mongoose');

const categoryModel = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    }
}, {timestamps: true});

module.exports = mongoose.model('Category', categoryModel);