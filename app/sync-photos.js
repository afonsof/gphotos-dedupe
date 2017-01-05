var Picasa = require('./utils/picasa.js');
var picasa = new Picasa();
var async = require("async");

const pageSize = 100;

function processAlbumPage(data, callback) {
    data.writeFn('album : ' + data.album.title + ' - photos:' + data.album.num_photos + '. photos ' + data.i + ' to ' + (data.i + pageSize));

    try {
        picasa.getPhotos(data.token.access_token, {
            albumId: data.album.id,
            startIndex: data.i,
            maxResults: data.pageSize,
            thumbsize: '32u'
        }, function (error, photos) {
            if (error) {
                data.writeFn(error);
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
    catch (e) {
        console.log(e);
        callback();
    }
}

module.exports = function (db, callback, writeFn) {
    var dbToken = db.collection('tokens');
    var dbAlbum = db.collection('albums');
    dbToken.findOne(function (err, token) {
        dbAlbum.find(function (err, albums) {
            var queue = async.queue(processAlbumPage);

            albums.forEach(function (album) {
                for (var i = 0; i < album.num_photos; i += pageSize) {
                    queue.push({
                        album: album,
                        i: i,
                        pageSize: pageSize,
                        token: token,
                        db: db,
                        writeFn: writeFn
                    });
                }
            });

            queue.drain = function () {
                callback();
            };
        });
    });
};