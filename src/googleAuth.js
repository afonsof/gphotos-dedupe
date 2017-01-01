var google = require('googleapis');
var config = require('../config.json');

function getOAuthClient() {
    var OAuth2 = google.auth.OAuth2;
    return new OAuth2(
        config.google.client_id,
        config.google.client_secret,
        "http://localhost:3000/google-login-redirect"
    );
}

module.exports = {
    generateAuthUrl: function () {
        var client = getOAuthClient();

        var scopes = [
            'https://www.googleapis.com/auth/plus.me',
            'https://picasaweb.google.com/data/'
        ];

        return client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes
        });
    },

    getToken: function(code, callback){
        var client = getOAuthClient();
        client.getToken(code, callback);
    }
};