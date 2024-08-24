const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({

    address_name: {
        type: String,
        required: [true, 'Please enter address name']
    },

    name: {
        type: String,
        required: [true, 'Pleae enter name']
    },  

    phone: {
        type: String,
        required: [true, 'Please enter phone']
    },

    email: {
        type: String,
        required: [false, 'Please enter email']
    },

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
        required: [false, 'Please enter an email'],
    },

    address: [
        {
            type: addressSchema,
            required: [false, 'Please enter an address']
        },
    ],

    status: {
        type: Boolean,
        required: [true, 'Please enter status'],
    },

    device: {
        type: String,
        required: [false, 'Please enter device']
    },

}, {
    timestamps: true,   
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userModel.virtual('id').get(function() {
    return this._id.toHexString();
});

userModel.set('toJSON', {
    virtuals: true
});
userModel.set('toObject', {
    virtuals: true
});


module.exports = mongoose.model('User', userModel);