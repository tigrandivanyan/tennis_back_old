const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const NamesSchema = new Schema({
    name:String,
    occupation:String,
});

// Model
const Names = mongoose.model('name', NamesSchema);

module.exports = Names;