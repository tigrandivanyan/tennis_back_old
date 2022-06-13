const mongoose = require('mongoose');
const prevNum = require('./models/prevNums');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();
const mongoDB = process.env.MONGO_DB;

const express = require("express");
const app = express();
const Log = require('./models/log');

app.use(cors({
    origin: "*"
}));
app.use(express.json())

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Mongoose is connected for logger server!!!')
}).catch(err => console.log(err))

app.post('/', (req, res) => {
    console.log("trying to save")
    let d = new Date();

    let log = new Log({text:req.body.text, date:d});

    console.log(d);
    log.save()
    .then(() => {
        console.log("saved")
        res.status(200).send()
    })
})

app.get('/getLogs', (req, res) => {
    Log.find({})
    .then(data => {
        res.send(data)
    })
})

app.listen(9094, console.log("Logger server is starting at 9094"))