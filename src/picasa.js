'use strict';

const querystring = require('querystring');

const executeRequest = require('./executeRequest');

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/auth';
const GOOGLE_API_HOST = 'https://www.googleapis.com';
const GOOGLE_API_PATH = '/oauth2/v3/token';

const PICASA_SCOPE = 'https://picasaweb.google.com/data';
const PICASA_API_FEED_PATH = '/feed/api/user/default';
const PICASA_API_ENTRY_PATH = '/entry/api/user/default';


const FETCH_AS_JSON = 'json';

function Picasa() {
    this.executeRequest = executeRequest
}

Picasa.prototype.getPhotos = getPhotos;
Picasa.prototype.getAlbums = getAlbums;
Picasa.prototype.postPhoto = postPhoto;
Picasa.prototype.deletePhoto = deletePhoto;

// Auth utilities
Picasa.prototype.getAuthURL = getAuthURL;
Picasa.prototype.getAccessToken = getAccessToken;

function deletePhoto(accessToken, albumId, photoId, callback) {
    const requestQuery = querystring.stringify({
        alt: FETCH_AS_JSON,
        access_token: accessToken
    });

    const requestOptions = {
        url: PICASA_SCOPE + PICASA_API_ENTRY_PATH + '/albumid/' + albumId + '/photoid/' + photoId + '?' + requestQuery,
        headers: {
            'If-Match': '*'
        }
    };

    this.executeRequest('del', requestOptions, callback)
}

function postPhoto(accessToken, albumId, photoData, callback) {
    const requestQuery = querystring.stringify({
        alt: FETCH_AS_JSON,
        access_token: accessToken
    });

    const photoInfoAtom = '<entry xmlns="http://www.w3.org/2005/Atom">' +
        '<title>' + photoData.title + '</title>' +
        '<summary>' + photoData.summary + '</summary>' +
        '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/photos/2007#photo"/>' +
        '</entry>';

    const requestOptions = {
        url: PICASA_SCOPE + PICASA_API_FEED_PATH + '/albumid/' + albumId + '?' + requestQuery,
        multipart: [
            {'Content-Type': 'application/atom+xml', body: photoInfoAtom},
            {'Content-Type': photoData.contentType, body: photoData.binary}
        ]
    };

    this.executeRequest('post', requestOptions, function (error, body) {
        if (error) return callback(error);

        const photo = getPhotoByEntry(body.entry);

        callback(error, photo)
    })
}


function getAlbums(accessToken, options, callback) {
    const accessTokenParams = {
        alt: FETCH_AS_JSON,
        access_token: accessToken
    };

    options = options || {};

    if (options.maxResults) accessTokenParams['max-results'] = options.maxResults;

    const requestQuery = querystring.stringify(accessTokenParams);

    const requestOptions = {
        url: PICASA_SCOPE + PICASA_API_FEED_PATH + '?' + requestQuery,
        headers: {
            'GData-Version': '2'
        }
    };

    this.executeRequest('get', requestOptions, function (error, body) {
        if (error) return callback(error);

        const albums = body.feed.entry.map(getAlbumByEntry);

        callback(null, albums)
    });
}


function getPhotos(accessToken, options, callback) {
    const accessTokenParams = {
        alt: FETCH_AS_JSON,
        access_token: accessToken
    };

    options = options || {};

    if (options.maxResults) accessTokenParams['max-results'] = options.maxResults;
    if (options.startIndex) accessTokenParams['start-index'] = options.startIndex;
    if (options.thumbsize) accessTokenParams['thumbsize'] = options.thumbsize;

    const requestQuery = querystring.stringify(accessTokenParams);

    var albumId = options.albumId ? '/albumid/' + options.albumId : '';

    const requestOptions = {
        url: PICASA_SCOPE + PICASA_API_FEED_PATH + albumId + '?' + requestQuery,
        headers: {
            'GData-Version': '2'
        }
    };

    this.executeRequest('get', requestOptions, function (error, body) {
        if (error) return callback(error);

        const photos = body.feed.entry.map(getPhotoByEntry);

        callback(null, photos)
    });
}

var photoSchema = {
    'gphoto$id': 'id',
    'gphoto$albumid': 'album_id',
    'gphoto$access': 'access',
    'gphoto$width': 'width',
    'gphoto$height': 'height',
    'gphoto$size': 'size',
    'gphoto$checksum': 'checksum',
    'gphoto$timestamp': 'timestamp',
    'gphoto$imageVersion': 'image_version',
    'gphoto$commentingEnabled': 'commenting_enabled',
    'gphoto$commentCount': 'comment_count',
    'content': 'content',
    'title': 'title',
    'summary': 'summary'
};

var albumSchema = {
    'gphoto$id': 'id',
    'gphoto$albumid': 'album_id',
    'gphoto$access': 'access',
    'gphoto$numphotos': 'num_photos',
    'title': 'title'
};

function getObjectByEntry(entry, schema) {
    var obj = {};

    Object.keys(schema).forEach(function (schemaKey) {
        const key = schema[schemaKey];

        if (key) obj[key] = checkParam(entry[schemaKey])
    });

    return obj;
}

function getPhotoByEntry(entry) {
    var ret =  getObjectByEntry(entry, photoSchema);
    ret.thumbnails = entry['media$group']['media$thumbnail'];
    return ret;
}

function getAlbumByEntry(entry) {
    return getObjectByEntry(entry, albumSchema);
}


function getAuthURL(config) {
    const authenticationParams = {
        access_type: 'offline',
        scope: PICASA_SCOPE,
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectURI
    };

    const authenticationQuery = querystring.stringify(authenticationParams);

    return GOOGLE_AUTH_ENDPOINT + '?' + authenticationQuery
}

function getAccessToken(config, code, callback) {
    const accessTokenParams = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirectURI,
        client_id: config.clientId,
        client_secret: config.clientSecret
    };

    const requestQuery = querystring.stringify(accessTokenParams);
    const options = {
        url: GOOGLE_API_HOST + GOOGLE_API_PATH + '?' + requestQuery
    };

    this.executeRequest('post', options, function (error, body) {
        if (error) return callback(error);

        callback(null, body.access_token)
    })
}

function checkParam(param) {
    if (param === undefined) return '';
    else if (isValidType(param)) return param;
    else if (isValidType(param['$t'])) return param['$t'];
    else return param
}

function isValidType(value) {
    return typeof value === 'string' || typeof value === 'number'
}

module.exports = Picasa;
