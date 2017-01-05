var Picasa = require('./app/utils/picasa.js');
var cookieParser = require('cookie-parser');
var mongoConnection = require('./app/utils/mongo-connection');
var googleAuth = require('./app/utils/google-auth');
var express = require('express');

var picasa = new Picasa();
var app = express();

module.exports = function () {

//View
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'ejs');

//Middlewares
    app.use(cookieParser());

    app.get('/google-login', function (req, res) {
        res.redirect(googleAuth.generateAuthUrl());
    });

    app.get('/google-login-redirect', function (req, res, next) {
        googleAuth.getToken(req.query.code, function (err, tokens) {
            if (!err) {
                mongoConnection(function (err, db) {
                    var dbTokens = db.collection('tokens');
                    dbTokens.drop();
                    dbTokens.insertOne(tokens);
                });
                res.send('OK');
            }
            else {
                res.send('ERROR');
            }
            next();
        });
    });

    app.get('/find-dupes', function (req, res) {
        mongoConnection(function (err, db) {
            db.collection('photos').aggregate([{
                $match: {
                    dhash: {$ne: null}
                }
            }, {
                $group: {
                    _id: {dhash: "$dhash"},
                    width: {$addToSet: "$width"},
                    height: {$addToSet: "$height"},
                    title: {$addToSet: "$title"},
                    timestamp: {$addToSet: "$timestamp"},
                    images: {$addToSet: "$content.src"},
                    count: {$sum: 1}
                }
            }, {
                $match: {
                    count: {$gte: 2}
                }
            }, {
                $sort: {count: -1}
            }, {
                $limit: 100
            }], function (err, dupes) {
                res.render('find-dupes.ejs', {dupes: dupes})
            });
        });
    });


    app.listen(3000, function () {
        console.log('Example app listening on port 3000!')
    });
};