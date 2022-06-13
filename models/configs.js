const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const ConfigSchema = new Schema({
    neededSetsToWin:Number,
    neededGamesToWin:Number,
    delay:Boolean,
    block:Boolean,
});

// Model
const Config = mongoose.model('config', ConfigSchema);

module.exports = Config;