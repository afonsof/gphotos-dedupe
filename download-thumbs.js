var Picasa = require('./src/picasa.js');
var picasa = new Picasa();
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var async = require("async");
var fs = require('fs');
var request = require('request');
var http = require('https');


var mongoUrl = 'mongodb://localhost:27017/gphotos-dedup';


var download = function (uri, filename, callback) {
    try {
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename))
                .on('close', callback)
                .on('error', function (err) {
                    console.log('Error' + err);
                });
        });
    }
    catch (e) {
        callback(e);
    }
};


function processPhoto(data, callback) {
    console.log(data.photo.id);
    download(data.photo.thumbnails[0].url, './images/' + data.photo.id + '.jpg', function (err) {
        if (err) {
            console.log(err);
            callback();
            return;
        }
        data.photo.downloaded = true;
        data.dbPhotos.updateOne({_id: data.photo._id}, data.photo, function (err) {
            callback();
        });
    });
}

MongoClient.connect(mongoUrl, function (err, db) {
    var dbPhotos = db.collection('photos');
    dbPhotos.find({downloaded: null}, function (err, photos) {
        var queue = async.queue(processPhoto, 5);

        photos.forEach(function (photo) {
            queue.push({
                photo: photo,
                dbPhotos: dbPhotos
            });
        });
    });
});
