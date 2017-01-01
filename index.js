var Picasa = require('./src/picasa.js');
var picasa = new Picasa();
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var cookieParser = require('cookie-parser');


var googleAuth = require('./src/googleAuth');

var express = require('express');
var app = express();

//View
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

//Middlewares
app.use(cookieParser());

var mongoUrl = 'mongodb://localhost:27017/gphotos-dedup';

app.get('/google-login', function (req, res) {
    res.redirect(googleAuth.generateAuthUrl());
});

app.get('/google-login-redirect', function (req, res, next) {
    googleAuth.getToken(req.query.code, function (err, tokens) {
        if (!err) {
            MongoClient.connect(mongoUrl, function (err, db) {
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

app.get('/get-photos', function (req, res, next) {
    var access_token = req.cookies.access_token;
    if (!access_token) {
        res.send('access_token does not exist');
    }
    picasa.getPhotos(access_token, options, function (error, photos) {
        res.render('get-photos.ejs', {photos: photos});
    });
});

app.get('/get-albums', function (req, res, next) {
    MongoClient.connect(mongoUrl, function (err, db) {
        var dbTokens = db.collection('tokens');
        dbTokens.findOne(function (err, token) {

            picasa.getAlbums(token.access_token, {}, function (error, albums) {
                var dbAlbums = db.collection('albums');
                dbAlbums.drop();
                dbAlbums.insertMany(albums);
                res.send('OK');
            });
        });
    });
});

app.get('/find-dupes', function (req, res, next) {
    MongoClient.connect(mongoUrl, function (err, db) {

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