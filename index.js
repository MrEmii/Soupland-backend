const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt-nodejs');
const MongoClient = require('mongodb').MongoClient;

const mongoURI = "mongodb://104.194.10.146:27017";

const mongodb = new MongoClient(mongoURI, { useNewUrlParser: true })

var accountsTokens = [];

var profilesDb
var usersDb;
var punishmentsDb;
const app = express();

app.set('port', process.env.PORT || 2053);
app.use(cors())
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.post("/register", (req, res) => {
    var uuid = req.body.uuid;
    var email = req.body.email
    usersDb.findOne({ "uuid": uuid }, (err, user) => {
        if (!user.loginToken && !user.password) {
            var token = (Math.random().toString(36).substr(2)) + (Math.random().toString(36).substr(2));
            var password = (Math.random().toString(36).substr(2)) + (Math.random().toString(36).substr(2));

            usersDb.updateOne({"uuid": uuid}, {
                $set: {
                    "auth":{
                        "token": token,
                        "password": bcrypt.hashSync(password, bcrypt.genSaltSync(8)),
                        "email": email
                    }
                }
            }, (err, doc) => {
                if(err){
                    res.send({"error": "error", "password": ""})
                }
                res.send({"password": password})
            })            

        }
    })

})

app.post("/player/:name", (req, res) => {
    var name = req.params.name;
    usersDb.findOne({ "playerName": name }, (err, ress) => {
        if (!err && ress) {
            profilesDb.findOne({ "playerName": name }, (errss, user) => {
                if (errss) {
                    res.send({ error: 1 })
                }
                punishmentsDb.find({ "targetID": ress.uuid }).toArray((err, bans) => {
                    if (errss) {
                        res.send({ error: 1 })
                    }

                    var finalProfile = {
                        user: ress,
                        kitPvp: user ? user : undefined,
                        punishments: Array.from(bans).length > 0 ? bans : undefined
                    }
                    res.send({ finalProfile })
                })

            })
        } else {
            res.send({ error: 3 })
        }
    })
})
app.post("/:uuid/bans", (req, res) => {
    var uuid = req.params.uuid;
    punishmentsDb.findOne({ "targetID": uuid }, (errs, bans) => {
        if (errs) {
            res.send({ error: 1 })
        }
        if (user) {
            var punishments = {
                got: bans
            }
            res.send({ punishments })
        } else {
            res.send({ error: 2 })
        }

    })
})
app.post("/players/stats", (req, res) => {

    profilesDb.find({}).toArray((err, docs) => {
        res.send({ users: docs })
    })

})

app.listen(2053, () => {
    mongodb.connect((err, client) => {
        if (err) {
            console.log(err);
        }
        profilesDb = client.db('KitPvP').collection("profiles")
        usersDb = client.db('axis').collection("profiles")
        punishmentsDb = client.db('axis').collection("punishments")
        console.log(`Server on port ${app.get('port')}`);
    })
})