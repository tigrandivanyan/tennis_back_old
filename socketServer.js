const mongoose = require('mongoose');
const dotenv = require('dotenv');
const net = require("net");

const Score = require('./models/scores');


dotenv.config();
const mongoDB = process.env.MONGO_DB;


const ioAPI = require('socket.io')(3331, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
})

const back = require('./back.js');
const mainSocket = require('./sockets/mainSocket.js');
const apiSocket = require('./sockets/apiSocket.js');

const io = require('socket.io')(9090, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
})

const kastilIO = require('socket.io')(8765, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
})

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Mongoose is connected for socket server!!!')
}).catch(err => console.log(err))


let tcpServer = net.createServer();

tcpServer.on('connection', srv => {
    
    srv.write("Hello");
    console.log("Connection opened")

    srv.on('data', (data) => {
        console.log(data.toString())
    })

    srv.on('error', (err) => { console.log(err) })

    srv.on('close', () => {
        console.log("Connection closed");
        // srv.destroy();
    })

    back.tcp.newScores = function(newScores, source){
        kastilIO.emit('newScores', newScores, source, source);
        let reverse = back.reversed(newScores);
        srv.write(back.tcpEncrypt(["01", source, newScores.player1, newScores.player2, newScores.wonGames1, newScores.wonGames2, reverse ? 1 : 0]))
    };

    back.tcp.finishSet = function(tourID, source){
        kastilIO.emit('setFinished', tourID, source);
        Score.find({tourID}).sort({$natural:-1})
        .then(data => {
            srv.write(back.tcpEncrypt(["03", tourID, data.length + 1, data[0].player1 > data[0].player2 ? 1 : 2]))
        })
    };

    back.tcp.finishGame = function(tourID, wonPlayer, source){
        kastilIO.emit('gameFinished', tourID, wonPlayer, source);
        srv.write(back.tcpEncrypt(["04", tourID, wonPlayer]))
    };

    back.tcp.newGame = function(source){
        kastilIO.emit('newGame', source);
        srv.write("**|05|**")
    };
    back.tcp.gameChecked = function(data, source){
        kastilIO.emit('gameChecked', data.tourID, source);
        srv.write(back.tcpEncrypt(["02", data.tourID, data.wonPlayer]))
    };
});

const api = {
    newScores:function(newScores, id){
        let scores = {
            player1:newScores.player1,
            player2:newScores.player2,
            wonGames1:newScores.wonGames1,
            wonGames2:newScores.wonGames2,
            names:newScores.names,
            reversed:back.reversed(newScores)
        };

        ioAPI.emit('newScores', scores);

        if(back.tcp.newScores){
            back.tcp.newScores(newScores, id);
        }
    },  
    gameChecked:function(tourID){
        Score.find({tourID})
        .then(data => {
            let d = new Date();

            let scores = {
                sets:[],
                checkTime:d,
                finishTime:data[data.length - 1].time,
            }
            data.forEach(score => {
                scores.sets.push({
                    player1:score.player1,
                    player2:score.player2,
                    wonGames1:score.wonGames1,
                    wonGames2:score.wonGames2,
                    names:score.names,
                    reversed:back.reversed(score)
                })
            })
            ioAPI.emit('gameChecked', scores);
            if(back.tcp.gameChecked){
                back.tcp.gameChecked({tourID, wonPlayer:data[data.length - 1].wonGames1 > data[data.length - 1].wonGames2 ? 1 : 2});
            }
        })
    }
}
tcpServer.listen(3332)

io.on('connection', socket => mainSocket(socket, api, io));
// ioAPI.on('connection', socket => apiSocket(socket, ioAPI, api, io));