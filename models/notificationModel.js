const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },

    heading: {
        type: String,
        required: [true, 'Please enter heading']
    },

    message: {
        type: String,
        required: [true, 'Please enter message']
    },

    redirect_to: {
        type: String,
        required: [false, 'Please enter redirect'],
        default: null,
    },

    specific_product: {
        type: String,
        required: false,
        default: null,
    },

    specific_category: {
        type: String,
        required: false,
        default: null
    },

    link: {
        type: String,
        required: false,
        default: null,
    },

    audience: {
        type: String,
        required: [false, 'Please enter an audience'],
        default: null,
    },


    branch: {
        type: String,
        required: false,
        default: null
    },

    customFilters: {
        type: String,
        required: [false, 'Please enter a banner']
    },

    customers: [{
        name: {
            type: String,
            required: false,
            default: null
        },
        _id: {
            type: String,
            required: false,
            default: null
        }
    }],

    status: {
        type: String,
        required: [true, 'Please enter status']
    },

    image: {
        type: String,
        required: [true, 'Please provide image']
    },  

    lastLive: {
        type: Date,
        required: false,
        default: null
    }

}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

module.exports = mongoose.model('Notification', notificationSchema);