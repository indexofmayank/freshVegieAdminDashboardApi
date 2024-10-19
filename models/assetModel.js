const mongoose = require('mongoose');

const assetSchema = mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Please enter name']
    },

    image: {
        type: String,
        required: [true, 'Please enter image']
    },
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Asset', assetSchema);