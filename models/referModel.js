const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },

    referredUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },

    referralCode: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },

    reward: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);