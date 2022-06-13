const mongoose = require('mongoose');

// Schema
const Schema = mongoose.Schema;
const ScoreSchema = new Schema({
    player1: Number,
    player2: Number,
    wonGames1: Number,
    wonGames2: Number,
    finished: Boolean,
    finishedGame:Boolean,
    lastSet:Boolean,
    doNotReverse:Boolean,
    reverseInLastSet:Boolean,
    names:Object,
    checked:Boolean,
    time:String,
    tourID:String,
    started:Boolean,
    startTime:String,
    modified:Boolean,
    comment:String
});

// Model
const Score = mongoose.model('score', ScoreSchema);

module.exports = Score;