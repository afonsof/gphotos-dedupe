var async = require("async");
var fs = require('fs');
var dhash = require('dhash');

function processPhotoHash(data, callback) {
    dhash(data.path + data.photo.id + '.jpg', function (err, hash) {
        if (!err) {
            data.writeFn('Total: ' + data.count + ' photos\n' + data.photo._id + ' => ' + hash);
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

module.exports = function (db, path, callback, writeFn) {
    var dbPhotos = db.collection('photos');
    dbPhotos.find({downloaded: true, dhash: {'$exists': false}}, function (err, photos) {
        var queue = async.queue(processPhotoHash);

        photos.count(function (err, count) {
            if(count==0){
                return callback();
            }

            photos.forEach(function (photo) {
                queue.push({
                    photo: photo,
                    dbPhotos: dbPhotos,
                    path: path,
                    writeFn: writeFn,
                    count: count
                });
            });

            queue.drain = function () {
                callback();
            };
        });
    });
};