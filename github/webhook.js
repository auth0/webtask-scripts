// Raw version of this file: http://bit.ly/1A1wkC3

var async = require('async')
    , request = require('request');

return function (context, req, res) {
    var body = '';
    var modified = {};
    var removed = {};
    var added = {};

    var err;
    ['auth0_client_id', 'auth0_client_secret', 'auth0_account'].forEach(function (i) {
        if (typeof context.data[i] !== 'string') {
            err = i;
        }
    });
    if (err) {
        try {
            console.log('ERROR: request without ' + err + '.');
            res.writeHead(400);
            return res.end('Missing ' + err);
        }
        catch (e) {
            // ignore
        }
    }

    async.series([
        function (callback) {
            // Get Auth0 access token
            var base_url = 'https://' + context.data.auth0_account + '.auth0.com/oauth/token';
            request({
                url: base_url,
                method: 'POST',
                json: true,
                body: {
                    client_id: context.data.auth0_client_id,
                    client_secret: context.data.auth0_client_secret,
                    grant_type: 'client_credentials'
                }
            }, function (error, ares, body) {
                if (error)
                    return callback(error);
                if (ares.statusCode !== 200)
                    return callback(new Error('Error obtaining access token. HTTP status ' + ares.statusCode));
                if (!body || typeof body !== 'object' || typeof body.access_token !== 'string')
                    return callback(new Error('Error obtaining access token. Invalid response body.'));
                context.data.auth0_token = body.access_token;
                return callback();
            });
        },
        function (callback) {
            // Collect payload of GitHub web hook
            req.on('data', function (chunk) { body += chunk; });
            req.on('end', function () {
                try {
                    body = JSON.parse(body);
                    if (!body || typeof body !== 'object')
                        throw new Error("Unexpected web hook payload.");
                    if (!body.repository || typeof body.repository.full_name !== 'string')
                        throw new Error("Repository not identified in web hook payload.");
                }
                catch (e) {
                    return callback(e);
                }
                return callback();
            });
            req.on('error', callback);
        },
        function (callback) {
            // Calculate changes
            if (Array.isArray(body.commits)) {
                for (var i = body.commits.length - 1; i >= 0; i--) {
                    var commit = body.commits[i];
                    if (Array.isArray(commit.added))
                        commit.added.forEach(process(added));
                    if (Array.isArray(commit.modified))
                        commit.modified.forEach(process(modified));
                    if (Array.isArray(commit.removed))
                        commit.removed.forEach(process(removed, modified, added));
                }
            }

            return callback();

            function process(a, b, c) {
                return function (file) {
                    var match = file.match(/^rules\/([^\.]+)\.js$/);
                    if (match) {
                        var rule = encodeURIComponent(match[1]);
                        a[rule] = 1;
                        if (b) {
                            delete b[rule];
                        }
                        if (c) {
                            delete c[rule];
                        }
                    }
                }
            }
        },
        function (callback) {
            // Obtain modified rules from GitHub
            console.log({ 
                account: context.data.auth0_account, 
                modified_rules: Object.getOwnPropertyNames(modified), 
                removed_rules: Object.getOwnPropertyNames(removed),
                added_rules: Object.getOwnPropertyNames(added)
            });

            var base_url = 'https://raw.githubusercontent.com/' 
                + body.repository.full_name + '/' + (context.data.branch || 'master') +'/rules/';
            async.eachSeries(
                Object.getOwnPropertyNames(modified),
                function (rule, callback) {
                    rule = encodeURIComponent(rule);
                    request({ 
                        url: base_url + rule + '.js',
                        method: 'GET',
                        encoding: 'utf8'
                    }, function (error, gres, body) {
                        if (error) 
                            return callback(error);
                        if (gres.statusCode !== 200) 
                            return callback(new Error('Error obtaining ' + base_url + rule + '.js. HTTP status ' + gres.statusCode));
                        modified[rule] = body;
                        return callback();
                    })
                }, callback);
        },
        function (callback) {
            // Delete rules removed in GitHub from Auth0
            var base_url = 'https://' + context.data.auth0_account + '.auth0.com/api/rules/';
            async.eachSeries(
                Object.getOwnPropertyNames(removed),
                function (rule, callback) {
                    request({
                        url: base_url + rule + '/',
                        method: 'DELETE',
                        headers: {
                            Authorization: 'Bearer ' + context.data.auth0_token
                        }
                    }, function (error, ares) {
                        if (error)
                            return callback(error);
                        if (!ares.statusCode || ares.statusCode < 200 || (ares.statusCode > 299 && ares.statusCode !== 404))
                            return callback(new Error('Error deleting rule ' + base_url + rule + '. HTTP status ' + ares.statusCode));
                        return callback();
                    });
                }, callback);
        },
        function (callback) {
            // Add new rules
            var base_url = 'https://' + context.data.auth0_account + '.auth0.com/api/rules';
            async.eachSeries(
                Object.getOwnPropertyNames(added),
                function (rule, callback) {
                    request({
                        url: base_url,
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer ' + context.data.auth0_token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: decodeURIComponent(rule),
                            enabled: true,
                            script: modified[rule]
                        })
                    }, function (error, ares) {
                        if (error)
                            return callback(error);
                        if (!ares.statusCode || ares.statusCode !== 201)
                            return callback(new Error('Error adding rule `' + rule + '`. HTTP status ' + ares.statusCode));
                        return callback();
                    });
                }, callback);
        },
        function (callback) {
            // Modify existing rules
            var base_url = 'https://' + context.data.auth0_account + '.auth0.com/api/rules/';
            async.eachSeries(
                Object.getOwnPropertyNames(modified),
                function (rule, callback) {
                    request({
                        url: base_url + rule,
                        method: 'PUT',
                        headers: {
                            Authorization: 'Bearer ' + context.data.auth0_token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            enabled: true,
                            script: modified[rule]
                        })
                    }, function (error, ares) {
                        if (error)
                            return callback(error);
                        if (!ares.statusCode || ares.statusCode !== 200)
                            return callback(new Error('Error updating rule `' + rule + '`. HTTP status ' + ares.statusCode));
                        return callback();
                    });
                }, callback);
        }
    ], function (error) {
        try {
            if (error) {
                console.log('ERROR', error);
                res.writeHead(500);
                res.end(error.toString());
            }
            else {
                res.writeHead(201);
                res.end(JSON.stringify({ 
                    account: context.data.auth0_account, 
                    modified_rules: Object.getOwnPropertyNames(modified), 
                    removed_rules: Object.getOwnPropertyNames(removed)
                }, null, 2));
            }
        }
        catch (e) {
            // ignore
        }
    });
};
