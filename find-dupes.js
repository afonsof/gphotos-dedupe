var Picasa = require('./src/picasa.js');
var picasa = new Picasa();
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var async = require("async");
var fs = require('fs');
var request = require('request');

var mongoUrl = 'mongodb://localhost:27017/gphotos-dedup';

