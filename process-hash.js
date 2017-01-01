var Picasa = require('./src/picasa.js');
var picasa = new Picasa();
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var async = require("async");
var fs = require('fs');

//var dhash = require('./src/dhash');
var dhash = require('dhash');

var mongoUrl = 'mongodb://localhost:27017/gphotos-dedup';

function processPhotoHash(data, callback) {
    dhash('./images/' + data.photo.id + '.jpg', function (err, hash) {
        console.log(data.photo.id);
        if (!err) {
            console.log(hash);
            data.photo.dhash = hash;
            data.dbPhotos.updateOne({_id: data.photo._id}, data.photo, function (err) {
                if (err) {
                    console.log(err);
                }
                callback();
            });
        }
        else {
            console.log(err);
            callback();
        }
    });
}

MongoClient.connect(mongoUrl, function (err, db) {
    var dbPhotos = db.collection('photos');
    dbPhotos.find({downloaded: true, dhash: {'$exists': false}}, function (err, photos) {
        var queue = async.queue(processPhotoHash, 10);

        var a = photos.count(function(b,c){
            console.log(a);
            console.log(c);
        });

        photos.forEach(function (photo) {
            queue.push({
                photo: photo,
                dbPhotos: dbPhotos
            });
        });
    });
});
