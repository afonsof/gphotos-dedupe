var mongoConnection = require('./utils/mongo-connection');
var Picasa = require('./utils/picasa.js');
var picasa = new Picasa();

mongoConnection(function (err, db) {
    var dbTokens = db.collection('tokens');
    dbTokens.findOne(function (err, token) {

        picasa.getAlbums(token.access_token, function (err, albums) {
            if(err){
                console.log(err);
                return;
            }
            var dbAlbums = db.collection('albums');
            dbAlbums.drop();
            dbAlbums.insertMany(albums);
        });
    });
});
