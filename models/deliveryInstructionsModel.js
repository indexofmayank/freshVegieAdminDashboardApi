const mongoose = require('mongoose');


const deliveryInstructionSchema = mongoose.Schema({

    minimumcart_amount: {
        type: Number,
        required: [true, 'Please provide minimum cart amount']
    },

    delivery_charges: {
        type: Number,
        required: [true, 'Please provide delivery charges']
    },

    initial_rewardpoint: {
        type: Number,
        required: [true, 'Please provide initial reward point']
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Deliveryinstructions', deliveryInstructionSchema);