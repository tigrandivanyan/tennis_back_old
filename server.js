const mongoose = require('mongoose');
const prevNum = require('./models/prevNums');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();
const mongoDB = process.env.MONGO_DB;

const express = require("express");
const app = express();
const Score = require('./models/scores');
const Graphic = require('./models/graphic');

app.use(cors({
    origin: "*"
}));
app.use(express.json())

const axios = require('axios');
const allowedIp = require('./models/allowedIPs');
const appName = "tennis_express_server";
const Names = require('./models/names');

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Mongoose is connected for express server!!!')
}).catch(err => console.log(err))

app.get('/prevNums', (req, res) => {
    console.log('prevNums')
    prevNum.find({})
        .then(data => {
            res.json({ data })
        })
        .catch(err => {
            console.log(err)
        })
})

app.get('/isClearDB', (req, res) => {
    console.log('isClearDB')
    Score.find().limit(1).sort({$natural:-1})
        .then(data => {
            if (data.length <= 1) {
                res.json({ ans: true })
            } else {
                res.json({ ans: false })
            }
        })
})


app.get('/getCurrentTourID', (req, res) => {
    console.log('getCurrentTourID')
    Score.find().limit(1).sort({$natural:-1})
        .then(data => {
            if (data.length > 0) {


                let tourID = [year, month, day, tour, game].join("-");

                res.send(tourID)
            } else {
                res.json()
            }
        })
})


app.get('/deleteGameNames', (req, res) => {
    console.log('deleteGameNames')
    Score.find().limit(1).sort({$natural:-1})
        .then((data) => {
            Score.updateOne(data[data.length - 1], { names: { player1: "Игрок 1", player2: "Игрок 2", judge: "Судья" }, tourID: "" }, (msg, err) => {
                console.log(msg, err);

                res.json(data)
            })
        })
})

app.post('/checkGame', (req, res) => {
    console.log('checkGame')
    Score.find({ tourID: req.body.tourID })
        .then((data) => {
            data.forEach((e) => {
                Score.updateOne(e, { checked: true }, (msg, err) => { console.log(msg, err) })
                .then(() => {
                    res.json()
                })
            })
        })
})

app.post('/unCheckSets', (req, res) => {
    console.log('unCheckSets');
    Score.updateMany({ tourID: req.body.tourID }, { checked: false }, (msg, err) => { 
        console.log(msg, err); 
        res.status(202).send({msg, err})
    })
    // Score.find({ tourID: req.body.tourID })
    //     .then((data) => {
    //         if(data.length > 0){
    //             data.forEach((e, i) => {
    //                 Score.updateOne(e, { checked: false }, (msg, err) => { console.log(msg, err);  })
    //             })
    //             res.status(202).send()
    //         }else{
    //             res.status(404).send()
    //         }
    //     })
})

app.post('/deleteSets', (req, res) => {
    console.log('deleteSets')
    Score.deleteMany({ tourID: req.body.tourID },  (msg, err) => { 
        console.log(msg, err); 
        res.status(202).send({msg, err})
    })
    // Score.find({ tourID: req.body.tourID })
    //     .then((data) => {
    //         if(data.length > 0){
    //             async function () {
    //                 data.forEach((e, i) => {
    //                     Score.deleteOne(e, (msg, err) => { console.log(msg, err); })
    //                 })
    //                 await res.status(202).send()
    //             }
    //         }else{
    //             res.status(404).send()
    //         }
    //     })
})


app.post('/newTourID', (req, res) => {
    console.log("newTourID", [req.body])
    Score.find({ tourID: req.body.oldTourID })
        .then(data => {
            Graphic.find({ tourID: req.body.newTourID.substring(0, 12) })
                .then(g => {
                    let names = ["Игрок 1", "Игрок 2", "Судья"]
                    if (g.length > 0) {
                        if (req.body.newTourID.length === 14) {
                            names = g[0].graphic[parseInt(req.body.newTourID[req.body.newTourID.length - 1], 10) - 1]
                        } else {
                            names = g[0].graphic[parseInt(req.body.newTourID[req.body.newTourID.length - 2] + req.body.newTourID[req.body.newTourID.length - 1], 10) - 1]
                        }
                        names = { player1: names[0], player2: names[1], judge: names[2] }

                        console.log(names);
                        data.forEach((e, i) => {
                            Score.updateOne(e, { tourID: req.body.newTourID, names }, (msg, err) => { console.log(msg, err) })
                            .then(() => {
                                console.log(data.length, i)
                                if(data.length - 1 === i){
                                    res.json();
                                }
                            })
                        })
                    }
                })
        })
})

app.get('/getAllowedIps', (req, res) => {
    allowedIp.find({})
    .then(data => {
        res.send(data)
    })
})

app.post('/addAllowedIp', (req, res) => {

    allowedIp.find({ip:req.body.ip})
    .then(data => {
        if(data.length === 0){
            let newIp = new allowedIp(req.body);
        
            newIp.save()
            .then((obj, err) => res.json({obj, err}))
        }else{
            res.status(200).send("already in DB")
        }
    })
})

app.post('/deleteIp', (req, res) => {
    allowedIp.deleteOne({ip:req.body.ip}, (msg, err) => {
        // console.log(err, msg)
        if(msg){
            if(msg.deletedCount === 1){
                res.json(200)
            }else{
                res.status(404).send()
            }
        }else{
            res.status(200).send()
        }
    })
})

app.get('/getNames', (req, res) => {
    Names.find({})
        .then(data => {
            if (data) {
                res.json(data);
            } else (
                res.json([])
            )
        })
})

app.post('/newName', (req, res) => {

    let sameName = false;

    Names.find({})
        .then(data => {
            data.forEach((e, i) => {
                if (e.name === req.body.name && e.occupation === req.body.occupation) {
                    sameName = true;
                }
            })
        })
        .then(() => {
            if (!sameName) {
                let newEmployee = new Names(req.body);

                newEmployee.save();

                res.json({ msg: "Добавлено", status: 200 })
            } else {
                res.send({ msg: "Уже есть работник с таким именем", status: 409 })
            }
        })

})

app.post('/deleteEmployee', (req, res) => {

    Names.deleteOne(req.body, (err, data) => {
        if (data.deletedCount === 1) {
            res.json(200)
        } else {
            res.json(404)
        }
    })
})

app.post('/getTourInfo', (req, res) => {
    console.log(req.body)
    Graphic.find(req.body)
        .then(data => {
            if (data.length > 0) {
                res.json({ graphic: data[0].graphic, status: 200 })
            } else {
                res.json({ status: 404 })
            }
        })
})

app.post('/addGraphic', (req, res) => {
    Graphic.find({ tourID: req.body.tourID })
        .then(data => {
            console.log(req.body, data)
            if (data.length > 0) {
                Graphic.updateOne(data[0], req.body)
                    .then((a, b) => {
                        console.log(a, b)
                    })
                res.json(200)

            } else {
                let newGraphic = new Graphic(req.body);

                newGraphic.save();

                res.json(200)
            }
        })
})

app.listen(9091, console.log("Express server is starting at 9091"))