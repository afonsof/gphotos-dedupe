var Picasa = require('./src/picasa.js');
var picasa = new Picasa();
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var async = require("async");

var mongoUrl = 'mongodb://localhost:27017/gphotos-dedup';
var pageSize = 100;

function processAlbumPage(data, callback) {
    console.log('album : ' + data.album.title + ' photos ' + data.i + ' to ' + (data.i + pageSize));

    try {
        picasa.getPhotos(data.token.access_token, {
            albumId: data.album.id,
            startIndex: data.i,
            maxResults: data.pageSize,
            thumbsize: '32u'
        }, function (error, photos) {
            if (error) {
                console.log(error);
                callback();
                return;
            }
            var dbPhotos = data.db.collection('photos');

            photos.forEach(function (photo) {
                dbPhotos.updateOne({id: photo}, photo, {upsert: true}, function (err) {
                });
            });
            callback();
        });
    }
    catch (e){
        console.log(e);
        callback();
    }
}


MongoClient.connect(mongoUrl, function (err, db) {
    var dbToken = db.collection('tokens');
    var dbAlbum = db.collection('albums');
    dbToken.findOne(function (err, token) {
        dbAlbum.find(function (err, albums) {
            var queue = async.queue(processAlbumPage, 10);

            albums.forEach(function (album) {
                console.log('album : ' + album.title + ' - photos:' + album.num_photos);

                for (var i = 0; i < album.num_photos; i += pageSize) {
                    queue.push({
                        album: album,
                        i: i,
                        pageSize: pageSize,
                        token: token,
                        db: db
                    });
                }
            });
        });
    });
});
