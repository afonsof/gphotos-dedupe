const mongoConnection = require('./utils/mongo-connection');
const downloadThumbs = require('./download-thumbs');
const processHash = require('./process-hash');
const syncPhotos = require('./sync-photos');
const site = require('../index');


var blessed = require('blessed');

// Create a screen object.
var screen = blessed.screen({
    smartCSR: true
});

screen.title = 'GPhotos Dedupe';

var syncAlbumBox = blessed.box({
    top: '0%',
    left: 0,
    width: '100%',
    height: '20%',
    content: '{bold}Syncing Albums{/bold}',
    tags: true,
    style: {
        fg: 'white',
        bg: 'red'
    }
});

var syncPhotoBox = blessed.box({
    top: '20%',
    left: 0,
    width: '100%',
    height: '20%',
    content: '{bold}Syncing Photos{/bold}',
    tags: true,
    style: {
        fg: 'white',
        bg: 'yellow'
    }
});

var downloadBox = blessed.box({
    top: '40%',
    left: '0',
    width: '100%',
    height: '20%',
    content: '{bold}Downloading{/bold}',
    tags: true,
    style: {
        fg: 'white',
        bg: 'green'
    }
});

var hashBox = blessed.box({
    top: '60%',
    left: 0,
    width: '100%',
    height: '20%',
    content: '{bold}Hashing{/bold}',
    tags: true,
    style: {
        fg: 'white',
        bg: 'blue'
    }
});

screen.append(syncAlbumBox);
screen.append(syncPhotoBox);
screen.append(downloadBox);
screen.append(hashBox);

screen.key(['escape', 'q', 'C-c'], function () {
    return process.exit(0);
});

screen.render();

function writePhotos(content) {
    syncPhotoBox.setContent("{bold}Syncing Photos...{/bold}\n" + content);
    screen.render();
}

function writeDownload(content) {
    downloadBox.setContent("{bold}Downloading...{/bold}\n" + content);
    screen.render();
}

function writeHash(content) {
    hashBox.setContent("{bold}Hashing...{/bold}\n" + content);
    screen.render();
}

mongoConnection(function (err, db) {

    var syncPhotosCallback = function () {
        setTimeout(function () {
            writeDownload('waiting for content...');
            syncPhotos(db, syncPhotosCallback, writePhotos);
        }, 1000);
    };
    syncPhotosCallback();

    var downloadCallback = function () {
        setTimeout(function () {
            writeDownload('waiting for content...');
            downloadThumbs(db, './images/', downloadCallback, writeDownload);
        }, 1000);
    };
    downloadCallback();

    var processHashCallback = function () {
        setTimeout(function () {
            writeHash('waiting for content...');
            processHash(db, './images/', processHashCallback, writeHash);
        }, 1000);
    };
    processHashCallback();
});

site();




