const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    address: {
        type: String,
        required: [true, 'please enter address']
    },

    locality: {
        type: String,
        required: [false, 'Please enter locality']
    },

    landmark: {
        type: String,
        required: [false, 'Pleae enter landmark']
    },

    city: {
        type: String,
        required: [true, 'Please enter city']
    },

    pin_code: {
        type: String,
        required: [true, 'Please enter pin code']
    },

    state: {
        type: String,
        required: [true, 'Please enter state']
    },

});

const userModel = mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Please enter name'],
    },

    phone: {
        type: String,
        required: [true, 'Please enter phone'],
    },

    email: {
        type: String,
        required: [true, 'Please enter an email'],
    },

    address: [
        {
            type: addressSchema,
            required: [true, 'Please enter an address']
        },
    ],

}, {timestamps: true});

module.exports = mongoose.model('User', userModel);