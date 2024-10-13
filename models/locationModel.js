const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    pin_code: {
        type: String,
        required: true, // Pin code is mandatory
        unique: true    // Ensure each pin code is unique
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // GeoJSON type
            required: true
        },
        coordinates: {
            type: [Number], // Array to hold [lng, lat]
            required: true,
            index: '2dsphere' // Enable geospatial queries
        }
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});
const Location = mongoose.model('Location', locationSchema);
module.exports = Location;