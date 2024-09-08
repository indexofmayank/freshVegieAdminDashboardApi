const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    address_name: {
        type: String,
        required: [true, 'Please enter address name']
    },
    name: {
        type: String,
        required: [true, 'Please enter name']
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
        required: [true, 'Please enter address']
    },
    locality: {
        type: String,
        required: [false, 'Please enter locality']
    },
    landmark: {
        type: String,
        required: [false, 'Please enter landmark']
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

const userInfoSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'Please enter key']
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can store various types (String, Number, Object, etc.)
        required: [true, 'Please enter value']
    }
});

const userModel = new mongoose.Schema({
    name: {
        type: String,
        required: [false, 'Please enter name']
    },
    phone: {
        type: String,
        required: [true, 'Please enter phone']
    },
    email: {
        type: String,
        required: [false, 'Please enter email']
    },
    address: [
        {
            type: addressSchema,
            required: [false, 'Please enter address']
        }
    ],
    status: {
        type: Boolean,
        required: [false, 'Please enter status']
    },
    device: {
        type: String,
        required: [false, 'Please enter device']
    },
    userInfo: [
        {
            type: userInfoSchema, // Storing the array of JSON objects
            required: false
        }
    ]
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
