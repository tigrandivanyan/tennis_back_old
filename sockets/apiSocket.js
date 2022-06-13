const back = require('../back.js');
const Score = require('../models/scores');

module.exports = function(socket, ioAPI, api, io){
    socket.on('addScoreToPlayer1', () =>{
        back.checkIP(socket.handshake.address, function(allowed){
            if(allowed === 200){
                Score.find().limit(1).sort({$natural:-1})
                .then(data => {
                    Score.updateOne(data[0], {player1:data[0].player1+1}, (msg, err) => {
                        console.log(msg, err);
                        io.emit('setScores', {player1:data[0].player1+1, ...data[0]});
                        api.newScores({...data[0]._doc, player1:data[0].player1+1, tourID:data[0].tourID}, '03')

                    })
                })
            }else{
                ioAPI.emit('error', allowed)
            }
        })
    })
    socket.on('addScoreToPlayer2', () =>{
        back.checkIP(socket.handshake.address, function(allowed){
            if(allowed === 200){
                Score.find().limit(1).sort({$natural:-1})
                .then(data => {
                    Score.updateOne(data[0], {player2:data[0].player2+1}, (msg, err) => {
                        console.log(msg, err);
                        io.emit('setScores', {player2:data[0].player2+1, ...data[0]})
                        api.newScores({...data[0]._doc, player2:data[0].player2+1, tourID:data[0].tourID}, '03')

                    })
                })
            }else{
                ioAPI.emit('error', allowed)
            }
        })
    })
    socket.on('changeScore', newScore =>{
        newScore = JSON.parse(newScore);
        back.checkIP(socket.handshake.address, function(allowed){
            if(allowed === 200){
                Score.find().limit(1).sort({$natural:-1})
                .then(data => {
                    Score.updateOne(data[0], {...newScore, tourID:data[0].tourID}, (msg, err) => {
                        console.log(msg, err);
                        io.emit('setScores', {...newScore, ...data[0]});
                        api.newScores({...data[0]._doc, ...newScore, tourID:data[0].tourID}, '03')
                    })
                })
            }else{
                ioAPI.emit('error', allowed)
            }
        })
    })
}