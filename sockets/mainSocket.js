const prevNum = require('../models/prevNums');
const Score = require('../models/scores');
const Config = require('../models/configs');
const Graphic = require('../models/graphic');
const Ip = require('../models/ips');

const back = require('../back.js');


module.exports = function(socket, api, io){
    console.log("New device connected to socket server at 9090", [socket.handshake.address]);

    socket.on('disconnect', () => {
        console.log('Device disconnected from socket server at 9090', [socket.handshake.address]);

        Ip.find({ip:socket.handshake.address})
        .then(data => {
            if(data.length > 0){
                Ip.deleteOne(data[0], (msg, err) => {
                    console.log("delete", err)
                    Ip.find({ })
                    .then(data => {
                        io.emit('setIps', data);
                    })
                })
            }
        })
    })

    Ip.find({})
        .then(data => {
            io.emit('setIps', data);
        })

    Score.find().limit(1).sort({$natural:-1})
        .then(data => {
            Config.find({})
                .then(config => {
                    if (data[data.length - 1]) {
                        let datum = new Object(data[data.length - 1]);
                        datum = { ...datum };
                        datum = datum._doc;
                        let conif = {};
                        if (config.length > 0) {
                            conif = new Object(config[config.length - 1]);
                            conif = { ...conif };
                            conif = conif._doc;
                        }
                        io.emit('setScores', { ...datum, ...conif })
                    } else {
                        let newScore = new Score({ player1: 0, player2: 0, wonGames2: 0, wonGames1: 0 });

                        newScore.save()
                            .then(() => {
                                if (config.length === 0) {
                                    let newConfigs = new Config({ neededSetsToWin: 11, neededGamesToWin: 5, block: false, delay: true })

                                    newConfigs.save()
                                        .then(() => {
                                            io.emit('setScores', { neededSetsToWin: 11, neededGamesToWin: 5, player1: 0, player2: 0, wonGames2: 0, wonGames1: 0 })
                                        })
                                } else {
                                    io.emit('setScores', { player1: 0, player2: 0, wonGames2: 0, wonGames1: 0 })
                                }
                            })
                    }
                })

        })

    socket.on('writeMyIP', () => {
        let newIP = new Ip({ip:socket.handshake.address});
        newIP.save()
        .then(() => {
            Ip.find({ })
            .then(data => {
                io.emit('setIps', data);
            })
        })
    })

    socket.on('newSet', scores => {
        console.log('new set')
        Score.find().limit(1).sort({$natural:-1})
            .then(data => {
                let newPrevDocument = new prevNum({ ...back.filterState(data[data.length - 1]) });
                newPrevDocument.save()
                    .then(() => {
                        back.deletePrev();
                        let newDocument = { wonGames1: scores.wonGames1, wonGames2: scores.wonGames2, finished: true, time: new Date(), checked: false }
                        Score.updateOne(data[data.length - 1], newDocument, (a, b) => { })
                            .then(() => {
                                api.newScores({ ...scores, player1: 0, player2: 0, finished: false, time: new Date(), tourID: data[data.length - 1].tourID }, '01')
                                if(back.tcp.finishSet){
                                    back.tcp.finishSet(data[data.length - 1].tourID)
                                }
                                let oldScoreDocument = new Score({ ...scores, player1: 0, player2: 0, finished: false, time: new Date(), tourID: data[data.length - 1].tourID })
                                oldScoreDocument.save(data[data.length - 1].tourID )
                                    .then(() => {
                                        io.emit('setScores', { ...scores, player1: 0, player2: 0, tourID: data[data.length - 1].tourID })
                                        back.getSets(undefined, io)
                                    })
                            })
                    })
            })
    })

    socket.on('finishGame', () => {
        console.log('finish game');
        Score.find().limit(1).sort({$natural:-1})
        .then(data => {
            if(back.tcp.finishGame){
                back.tcp.finishGame(data[data.length - 1].tourID, data[data.length - 1].wonGames1 > data[data.length - 1].wonGames2 ? 1 : 2)
            }
            Score.updateOne(data[data.length - 1], { finishedGame: true, time: new Date(), checked: false}, (a, b) => {
                back.getSets(undefined, io);
            })
        })
        prevNum.remove({}, (a, b) => {
        })

    })

    socket.on('newGame', () => {
        console.log('newGame');

        api.newScores({ player1: 0, player2: 0, wonGames1: 0, wonGames2: 0, startTime: new Date(), finishedGame:false }, '01');

        if(back.tcp.newGame){
            back.tcp.newGame()
        }
        let newScoreDocument = new Score({ player1: 0, player2: 0, wonGames1: 0, wonGames2: 0, startTime: new Date(), finishedGame:false })
        newScoreDocument.save()
            .then(() => {
                io.emit('setScores', { player1: 0, player2: 0, wonGames1: 0, wonGames2: 0, gonnaWin: {}, lastSet: false, doNotReverse: false, reverseInLastSet: false, finishedGame:false })
                Score.find().limit(2).sort({$natural:-1})
                    .then(data => {
                        data = data.reverse();
                        Score.updateOne(data[data.length - 1], { started: true, startTime:new Date() }, (msg, err) => console.log(msg, err))
                            .then(() => {
                                let newTourID = data[data.length - 2].tourID;

                                if ((newTourID[newTourID.length - 2] + newTourID[newTourID.length - 1]) === "30") {
                                    newTourID = newTourID.slice(0, -3);

                                    let newTour = parseInt(newTourID[newTourID.length - 1], 10) + 1;

                                    if (newTour - 3 > 0) {
                                        newTour -= 3;
                                        let d = new Date(newTourID.slice(0, -2));
                                        d.setDate(d.getDate() + 1);

                                        d = d.toISOString().split('T')[0]

                                        newTourID = [d, newTour].join("-")
                                    } else {
                                        newTourID = newTourID.slice(0, -1);
                                        newTourID += newTour;
                                    }


                                    Graphic.find({ tourID: newTourID })
                                        .then(data => {
                                            if (data.length > 0) {
                                                let newNames = data[0].graphic[0];

                                                let newTourIDWithGame = newTourID + '-1';
                                                io.emit('setScores', { names: { player1: newNames[0], player2: newNames[1], judge: newNames[2] }, tourID: newTourIDWithGame })
                                                back.getSets(undefined, io)
                                            } else {
                                                io.emit('setScores', { names: { player1: "Игрок 1", player2: "Игрок 2", judge: "Судья" }, tourID: "" })
                                                back.getSets(undefined, io)
                                            }
                                        })
                                } else {
                                    let lastGame = newTourID[newTourID.length - 1];
                                    newTourID = newTourID.slice(0, -1);

                                    if (newTourID[newTourID.length - 1] !== "-") {
                                        lastGame = newTourID[newTourID.length - 1] + lastGame;
                                        newTourID = newTourID.slice(0, -1);
                                    }

                                    newTourID = newTourID.slice(0, -1);

                                    Graphic.find({ tourID: newTourID })
                                        .then(data => {
                                            if (data.length > 0) {
                                                let newNames = data[0].graphic[parseInt(lastGame, 10)];

                                                let newTourIDWithGame = newTourID + '-' + (parseInt(lastGame, 10) + 1);
                                                io.emit('setScores', { names: { player1: newNames[0], player2: newNames[1], judge: newNames[2] }, tourID: newTourIDWithGame })
                                                back.getSets(undefined, io)
                                            } else {
                                                io.emit('setScores', { names: { player1: "Игрок 1", player2: "Игрок 2", judge: "Судья" }, tourID: "" })
                                                back.getSets(undefined, io)
                                            }
                                        })

                                }
                            })
                    })
            })




    })

    socket.on('undoScores', changeSet => {
        console.log("Undo scores socket recived")
        prevNum.find().limit(1).sort({$natural:-1})
            .then(data => {
                Score.find().limit(2).sort({$natural:-1})
                    .then(scoreData => {
                        scoreData = scoreData.reverse();
                        let scores = data[data.length - 1];
                        let newScore = back.filterState(scores);
                        let prevScore = scoreData[scoreData.length - 1];
                        console.log("undo")
                        console.log(prevScore, newScore);
                        if (prevScore) {
                            prevScore = back.filterState(prevScore);
                            if (
                                (prevScore.player1 === newScore.player1 &&
                                prevScore.player2 === newScore.player2 &&
                                prevScore.wonGames1 === newScore.wonGames1 &&
                                prevScore.wonGames2 === newScore.wonGames2)

                            ) {
                            console.log("kildim4")

                                Score.deleteOne(scoreData[scoreData.length - 1], (a, b) => console.log(a, b))
                                    .then(() => {
                                        Score.updateOne(scoreData[scoreData.length - 2], { finished: false, finsihedGame: false, started: false })
                                            .then(() => {
                                                io.emit('setScores', newScore)
                                                back.deletePrev(true);
                                            })
                                    })
                            } else if (prevScore.wonGames1 !== newScore.wonGames1 || prevScore.wonGames2 !== newScore.wonGames2) {
                                console.log(prevScore, newScore)
                                if (changeSet || prevScore.wonGames1 === 5 || prevScore.wonGames2 === 5) {
                                    console.log("kildim3")

                                    api.newScores({...scoreData[scoreData.length - 1], ...{ finished: false, ...newScore }}, '01')
                                    Score.updateOne(scoreData[scoreData.length - 1], { finished: false, ...newScore })
                                        .then(() => {
                                            io.emit('setScores', { ...newScore, changeSet: false })
                                            back.deletePrev(true);
                                            back.getSets(undefined, io);
                                        })

                                    console.log("Prev score is", prevScore, newScore, scoreData[scoreData.length - 1]);
                                    if(prevScore.wonGames1 !== 5 && prevScore.wonGames2 !== 5){
                                        Score.deleteOne(scoreData[scoreData.length - 2], (a, b) => console.log(a, b))
                                    }
                                } else{
                                    console.log("kildim2")
                                    io.emit('setScores', { changeSet: true })

                                    setTimeout(() => {
                                        io.emit('setScores', { changeSet: false })
                                    }, 5000)
                                }
                            } else {
                                console.log("kildim1");
                                api.newScores({...scoreData[scoreData.length - 1], ...newScore}, '01')                               
                                Score.updateOne(scoreData[scoreData.length - 1], newScore)
                                    .then(() => {
                                        io.emit('setScores', newScore)
                                        back.deletePrev(true);
                                    })
                            }
                        } else {
                            console.log("kildim");
                            api.newScores({...scoreData[scoreData.length - 1], ...newScore}, '01')
                            Score.updateOne(scoreData[scoreData.length - 1], newScore)
                                .then(() => {
                                    io.emit('setScores', newScore)
                                    back.deletePrev(true);
                                })
                        }
                    })

            })
    })

    socket.on('help', () => {
        io.emit('help')
    })

    socket.on('refresh', () => {
        io.emit('refresh')
    })

    socket.on('scoreUpdate', scores => {
        // console.log('scoreUpdate', [scores]);
        
        let d1 = Date.now();

        // console.log(scores);

        Score.find().limit(1).sort({$natural:-1})
            .then((data) => {
                console.log(Date.now() - d1)
                console.log(data)

                if (data[data.length - 1]) {
                    if (!data[data.length - 1].finished) {
                        back.deletePrev();

                        let datum = data[data.length - 1];
                        let newPrevs = {
                            player1: datum.player1,
                            player2: datum.player2,
                            wonGames1: datum.wonGames1,
                            wonGames2: datum.wonGames2,
                            doNotReverse: datum.doNotReverse,
                            lastSet: datum.lastSet,
                            reverseInLastSet: datum.reverseInLastSet,
                            names: datum.names,
                            tourID: datum.tourID,
                        };

                        console.log(scores)

                        let prevNumDocument = new prevNum(newPrevs);

                        prevNumDocument.save()
                            .then(() => {
                                let dd = Date.now();
                                api.newScores({...data[data.length - 1], ...scores}, scores.id ? scores.id : '01')
                                Score.updateOne(data[data.length - 1], scores)
                                .then(() => {
                                        console.log(Date.now() - dd)
                                        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
                                        io.emit('setScores', scores)
                                    })
                            })


                    }
                } else {

                    let newScoreDocument = new Score({ ...scores, time: new Date() });

                    newScoreDocument.save()
                        .then(() => {
                            io.emit('setScores', scores)
                        })
                }
            })


    })

    socket.on('setTourID', info => {

        let tourID = [info.date, info.tour, info.game].join("-");
        let tourIDNoGame = [info.date, info.tour].join("-");

        Score.find().limit(1).sort({$natural:-1})
            .then(scores => {

                Graphic.find({ tourID: tourIDNoGame })
                    .then(data => {
                        if (data.length > 0) {
                            let player1 = data[0].graphic[info.game - 1][0];
                            let player2 = data[0].graphic[info.game - 1][1];
                            let judge = data[0].graphic[info.game - 1][2];
                            Score.updateOne(scores[scores.length - 1], { names: { player1, player2, judge }, tourID }, (msg, err) => {
                                console.log(msg, err)
                                io.emit('setScores', { names: { player1, player2, judge }, tourID })

                            })

                        }
                    })

            })
    });


    socket.on('warn', (text) => {
        io.emit('warn', text)
    })

    socket.on('getSets', callback => back.getSets(callback, io));

    socket.on('saveSet', (res) => {
        let s = res.set;
        console.log('saveSet');
        Score.find({ _id: s._id })
            .then((data) => {
                Score.updateOne(data[data.length - 1], { ...s, modified: true }, (msg, err) => { back.getSets(undefined, io); console.log(msg, err) })
            })
    })


    socket.on('setChecked', scores => api.setChecked(scores))
    socket.on('gameChecked', scores => {
        console.log('gameChecked')
        api.gameChecked(scores.tourID);

    })
}