const prevNum = require('./models/prevNums');
const Score = require('./models/scores');
const allowedIp = require('./models/allowedIPs');

module.exports = {
    reversed:function(datum){
        let reversed = false;
            
        if((datum.wonGames1 + datum.wonGames2) % 2 !== 0){
            reversed = true;
        }else{
            reversed = false;
        }
    
        if(datum.doNotReverse){
            reversed = !reversed;
        }
        
        if(datum.reversedInLastSet){
            reversed = !reversed;
        }
    
        return reversed;
    },

    tcpEncrypt:function(arr){
        let command = arr.join('$');
        command = "**|" + command + "|**";
        return command;
    },

    deletePrev:function (reverse) {
        prevNum.find({})
            .then(data => {
                if (reverse) {
                    prevNum.deleteOne(data[data.length - 1], (a, b) => {
                    })
                } else {
                    if (data.length >= 50) {
                        prevNum.deleteOne(data[0], (a, b) => {
                        })
                    }
                }
            })
    },
    
    filterState: function (state) {
        return {
            player1: state.player1,
            player2: state.player2,
            wonGames1: state.wonGames1,
            wonGames2: state.wonGames2,
            lastSet: state.lastSet,
            doNotReverse: state.doNotReverse,
            reverseInLastSet: state.reverseInLastSet,
            names: state.names,
            tourID: state.tourID,
        }
    },

    getSets: function (callback, io) {
        console.log("getSets");
        Score.find({checked:false})
            .then(data => {
    
                io.emit('setSets', data)
            })
    },
    
    tcp: {
        newScores:function(newScores){},
        finishSet:function(tourID){},
        finishGame:function(tourID, wonPlayer){},
        newGame:function(){},
        gameChecked:function(obj){}
    },

    checkIP:async function(clientIP, callback){
        let allow = false;
        let allowed;
        clientIP = clientIP.slice(7);
    
        allowedIp.find({ })
        .then(data => {
            data.forEach(ip => {
                if(clientIP === ip.ip){
                    allow = true;
                }
            })
    
            if(data.length === 0){
                // res.status(400).send("This operation requires allowed ip but there is no ip found in DB")
                allowed = "This operation requires allowed ip but there is no ip found in DB"
            }else if(!allow){
                // res.status(400).send("Your ip is not allowed to make changes in scores")
                allowed = "Your ip is not allowed to make changes in scores"
            }else{
                allowed = 200
                // if(callback){
                //     callback(req, res);
                // }

            }
    
            if(callback){
                callback(allowed)
            }
        })
    }
}