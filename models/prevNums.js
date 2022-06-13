const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const prevNumSchema = new Schema({
    player1: Number,
    player2: Number,
    wonGames1: Number,
    wonGames2: Number,
    lastSet:Boolean,
    doNotReverse:Boolean,
    reverseInLastSet:Boolean,
    names:Object,
    finished:Boolean,
    tourID:String
});

// Model
const prevNum = mongoose.model('prevNum', prevNumSchema);

module.exports = prevNum;