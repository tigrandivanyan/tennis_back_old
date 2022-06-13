const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const allowedIpSchema = new Schema({
    ip:String
});

// Model
const allowedIp = mongoose.model('allowedIp', allowedIpSchema);

module.exports = allowedIp;