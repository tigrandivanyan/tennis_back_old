const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const IpSchema = new Schema({
    ip:String
});

// Model
const Ip = mongoose.model('ip', IpSchema);

module.exports = Ip;