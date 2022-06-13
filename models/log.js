const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const logSchema = new Schema({
    date:String,
    text:String
});

// Model
const Log = mongoose.model('log', logSchema);

module.exports = Log;