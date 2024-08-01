const mongoose = require('mongoose');

const userModel = mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Please enter name'],
    },

    phone: {
        type: String,
        require: [true, 'Please enter phone'],
    },

    email: {
        type: String,
        require: [true, 'Please enter an email'],
    },

    address: {
        type: String,
        required: [true, 'Please enter an address']
    }

}, {timestamps: true});

module.exports = mongoose.model('User', userModel);