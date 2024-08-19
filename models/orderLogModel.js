const mongoose = require('mongoose');

const orderLogSchema = mongoose.Schema({


}, { strict: false });

module.exports = mongoose.model('OrderLogs', orderLogSchema);