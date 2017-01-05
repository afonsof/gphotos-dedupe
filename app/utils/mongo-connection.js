var MongoClient = require('mongodb').MongoClient;
var mongoUrl = 'mongodb://localhost:27017/gphotos-dedupe';

module.exports = function(callback){
    MongoClient.connect(mongoUrl, callback);
};