const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    },

    description: {
        type: String,
        required: true
    }
});

const walletSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    balance: {
        type: Number,
        default: 0,
    },

    transactions: [
        {
            type: transactionSchema,
            required: false
        }
    ]
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

module.exports = mongoose.model('Wallet', walletSchema);