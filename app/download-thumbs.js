var mongoConnection = require('./utils/mongo-connection');
var async = require("async");
var fs = require('fs');
var request = require('request');

var download = function (uri, filename, callback) {
    try {
        request.head(uri, function (err) {
            if (err) {
                callback(err);
                return;
            }
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    }
    catch (err) {
        callback(err);
    }
};


function processPhoto(data, callback) {
    data.writeFn('Total: ' + data.count + ' photos.\ndownloading ' + data.photo._id + '...');
    download(data.photo.thumbnails[0].url, data.path + data.photo.id + '.jpg', function (err) {
        if (err) {
            console.log(err);
            callback();
            return;
        }
        data.photo.downloaded = true;
        data.dbPhotos.updateOne({_id: data.photo._id}, data.photo, callback);
    });
}

module.exports = function (db, path, callback, writeFn) {
    var dbPhotos = db.collection('photos');
    dbPhotos.find({downloaded: null}, function (err, photos) {
        photos.count(function (err, count) {
            if(count==0){
                return callback();
            }
            
            var queue = async.queue(processPhoto);

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
