const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
app.use(cors());
app.use(express.json())
const Score = require('./models/scores')
const Ip = require('./models/ips')
const Graphic = require('./models/graphic')

const mongoose = require('mongoose');
const allowedIp = require('./models/allowedIPs');
const mongoDB = process.env.MONGO_DB || 'mongodb://10.200.99.21/tennis_test';

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log(mongoDB)
}).catch(err => console.log(err));

function reversed(datum){
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
}


function checkIP(callback, req, res){
    let allow = false;
    let clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    clientIP = clientIP.slice(7);

    allowedIp.find({ })
    .then(data => {
        data.forEach(ip => {
            if(clientIP === ip.ip){
                allow = true;
            }
        })

        if(data.length === 0){
            res.status(400).send("This operation requires allowed ip but there is no ip found in DB")
        }else if(!allow){
            res.status(400).send("Your ip is not allowed to make changes in scores")
        }else{
            if(callback){
                callback(req, res);
            }
        }


    })
}

app.get('/getCurrentScores', (req, res) => {
    Score.find().limit(1).sort({$natural:-1})
    .then(data => {
        let response = {};
        let reverse = reversed(data[0])

        
        response.player1 = data[0].player1;
        response.player2 = data[0].player2;
        response.wonGames1 = data[0].wonGames1;
        response.wonGames2 = data[0].wonGames2;
        response.names = data[0].names;
        response.tourID = data[0].tourID;
        response.reversed = reverse;
        response.msg = 200

        res.status(200).send(JSON.stringify(response));
    })
    .catch(err => {
        console.log(err)
        res.status(500).send(JSON.stringify({error:"Cannot connect to DB", msg:500}))
    })
})

app.get('/getConnectedIPs', (req, res) => {
    Ip.find({ })
    .then(data => {
        let ips = []; 
        
        if(data.length > 0){
            data.forEach(datum => {
                ips.push({ip:datum.ip, isAllowedToUse:datum.isAllowedToUse})
            })
            res.status(200).send(JSON.stringify({ips, msg:200}))
        }else{
            res.status(404).send(JSON.stringify({ips:[], msg:"No connected ips found"}))
        }
    })
    .catch(err => {
        res.status(500).send(JSON.stringify({error:"Cannot connect to DB", msg:500}))
    })
})

app.get('/getPlayersNames', (req, res) => {
    Score.find().limit(1).sort({$natural:-1})
    .then(data => {

        let namesIni = data[0].names;

        let reverse = reversed(data[0])

        
        let names = [
            {name:namesIni.player1, occupation:"player1"},
            {name:namesIni.player2, occupation:"player2"},
            {name:namesIni.judge, occupation:"judge"}
        ];

        let msg = 200;
        if(namesIni.player1 === "Игрок 1"){
            msg = "player1 names not specified"
            if(namesIni.player2 === "Игрок 2"){
                msg = "no player names"
            }
        }


        res.status(200).send(JSON.stringify({msg:200, names, reverse}));
    })
    .catch(err => {
        res.status(500).send(JSON.stringify({error:"Cannot connect to DB", msg:500}))
    })
})

app.get('/getAllScores', (req, res) => {
    Score.find({ })
    .then(data => {
        res.status(200).send(JSON.stringify({data}))
    })
    .catch(err => {
        res.status(500).send(JSON.stringify({error:"Error with DB", msg:500}))
    })
})

app.get('/getAllGraphics', (req, res) => {
    Graphic.find({ })
    .then(data => {
        res.status(200).send(JSON.stringify({data}))
    })
    .catch(err => {
        res.status(500).send(JSON.stringify({error:"Error with DB", msg:500}))
    })
})

app.post('/getScore', (req, res) => {

    Score.find(req.body)
    .then(data => {
        console.log(data)

        let scores = [];
        let msg = 200;
        let status = 200;
        if(data.length > 0){
            data.forEach(datum => {

                let score = {
                    player1:datum.player1,
                    player2:datum.player2,
                    wonGames1:datum.wonGames1,
                    wonGames2:datum.wonGames2,
                    name:datum.names,
                    reversed:reversed(datum)
                }

                scores.push(score)
            })
        }else{
            msg = "Not found any score with your filter";
            status = 404;
        }

        res.status(status).send(JSON.stringify({scores, msg}))
    })
    .catch(err => {
        res.status(500).send(JSON.stringify({msg:500, error:err}))
    })


})

app.post('/getGraphic', (req, res) => {
    Graphic.find({tourID:req.body.tour})
    .then(data => {
        if(data.length === 0){
            res.status(404).send("No graphic found for this tour")
        }else{
            res.status(200).send(JSON.stringify({graphic:data[0].graphic}))
        }
    })
})

app.post('/changeScore', (req, res) => {
    checkIP(function(req, res){
        if(req.body.newScores){
            if(req.body.currentScore && req.body.specificSet){
                res.status(400).send("You should specify only currentScore or specificSet not both simultaniously")
            }else if(req.body.currentScore){
                Score.find().limit(1).sort({$natural:-1})
                .then(data => {
                    Score.updateOne(data[0], req.body.newScores, (err, msg) => {
                        console.log(err, msg)
                        if(msg.nModified === 1){
                            res.status(200).send("OK")
                        }else{
                            res.status(304).send("Nothing to edit")
                        }
                    })
                })
            }else if(req.body.specificSet){
                Score.find({tourID:req.body.specificSet.tourID})
                .then(data => {
                    if(data.length > 0){
                        if(data[req.body.specificSet.setNumber - 1]){
                            Score.updateOne(data[req.body.specificSet.setNumber - 1], req.body.newScores, (err, msg) => {
                                if(msg.modifiedCount === 1){
                                    res.status(200).send("OK")
                                }else{
                                    res.status(304).send("Nothing to edit");
                                }
                            })
                        }else{
                            res.status(404).send("Found sets with this tourID but there is no such set")
                        }
                    }else{
                        res.status(404).send("No set found with this tourID")
                    }
                })
            }
        }else{
            res.status(400).send("No new scores")
        }
    }, req, res)
})

app.listen(3330, () => console.log("Tennis api listenning at 3330"))