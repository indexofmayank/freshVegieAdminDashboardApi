const mongoose = require('mongoose');


const deliveryInstructionSchema = mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Please enter name']
    },

    status: {
        type: String,
        required: [true, 'Please enter status']
    },

    total_distance: {
        type: Number,
        required: [true, 'Pleae provide total distance']
    },

    surge_fee: {
        type: Number,
        required: [true, 'Pleae provide surge fee']
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Deliveryinstructions', deliveryInstructionSchema);