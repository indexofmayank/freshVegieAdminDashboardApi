const mongoose = require('mongoose');

// Define the schema for the circle
const circleSchema = new mongoose.Schema({
  center: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  radius: {
    type: Number, // Radius in meters
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

circleSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

circleSchema.set('toJSON', {
    virtuals: true
});

circleSchema.set('toObject', {
    virtuals: true
});


module.exports = mongoose.model('Circle',  circleSchema);
