const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    address_name: {
        type: String,
        required: [false, 'Please enter address name']
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
        required: [false, 'Please enter address']
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

const userModel = new mongoose.Schema({
    name: {
        type: String,
        required: [false, 'Please enter name']
    },
    phone: {
        type: String,
        min: 10,
        max: 10,
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
        required: [false, 'Please enter status'],
        default: true
    },
    device: {
        type: String,
        required: [false, 'Please enter device']
    },
    userReferrInfo: {
        referralCode: {
            type: String,
            required: false,
        },
        referralAmount: {
            type: Number,
            required: false,
            default: 20
        },
        referredTo: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: false
                },
                referredAt: {
                    type: Date,
                    require: false,
                    default: Date.now()
                }
            }
        ],
    },
    userWalledInfo: {
        type: Number,
        required: false,
        default: 0
    },
    userInfo: [
        {
            type: mongoose.Schema.Types.Mixed,
            required: false
        }
    ],
    fcm_token: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userModel.virtual('id').get(function () {
    return this._id.toHexString();
});

userModel.set('toJSON', {
    virtuals: true
});
userModel.set('toObject', {
    virtuals: true
});

module.exports = mongoose.model('User', userModel);
