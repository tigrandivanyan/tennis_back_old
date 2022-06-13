const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const GraphicSchema = new Schema({
    tourID: String,
    graphic:Array,
});

// Model
const Graphic = mongoose.model('graphic', GraphicSchema);

module.exports = Graphic;