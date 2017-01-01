'use strict';

var request = require('request');

function executeRequest(method, requestOptions, callback) {
    request[method](requestOptions, function (error, response, body) {
        if (error) return callback(error);

        if (response.statusCode < 200 || response.statusCode > 226) {
            const unknownError = new Error('UNKNOWN_ERROR');

            unknownError.statusCode = response.statusCode;
            unknownError.body = body;
            console.log('Error: ' + response.statusCode + body);

            return callback(unknownError)
        }

        if (body.length < 1) return callback();

        try {
            callback(null, JSON.parse(body))
        } catch (error) {
            callback(error)
        }
    })
}

module.exports = executeRequest;
