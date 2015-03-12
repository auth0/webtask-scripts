// Raw version of this file: https://raw.githubusercontent.com/auth0/webtask-scripts/master/stripe/stripe_charge.js

var request = require('request')
    , async = require('async')
    , querystring = require('querystring');

return function (context, req, res) {
    console.log('REQUEST', req.headers);
    async.series([
        function (callback) {
            // Collect www-form-urlencoded paylod of a HTTPS form POST
            // FUTURE: This will be part of Auth0 Webtask core functionality
            var body = '';
            req.on('data', function (chunk) { body += chunk; });
            req.on('end', function () {
                try {
                    body = querystring.parse(body);
                    if (!body || typeof body !== 'object')
                        throw error(400, 'Unexpected payload.');
                    for (var p in body)
                        if (!context.data[p])
                            context.data[p] = body[p];
                }
                catch (e) {
                    return callback(e);
                }
                return callback();
            });
            req.on('error', callback);
        },
        function (callback) {
            // Validate input parameters
            if (!context.data.callback)
                context.data.callback = req.headers['referer'];
            var required_params = ['stripeToken', 'callback', 'amount', 'currency', 'STRIPE_SECRET_KEY'];
            for (var p in required_params)
                if (!context.data[required_params[p]])
                    return callback(
                        error(400, new Error('The `' + required_params[p] + '` parameter must be provided.')));
            callback();
        },
        function (callback) {
            // Process charge through Stripe
            request({ 
                url: 'https://api.stripe.com/v1/charges',
                method: 'POST',
                auth: {
                    user: context.data.STRIPE_SECRET_KEY,
                    pass: ''
                },
                form: {
                    source: context.data.stripeToken,
                    amount: context.data.amount,
                    currency: context.data.currency
                }
            }, function (error, sres, body) {
                if (error)
                    return callback(error);
                try {
                    body = JSON.parse(body);
                }
                catch (e) {
                    return callback(new Error('Unable to parse Stripe response as JSON.'));
                }
                var redirect_hash;
                if (sres.statusCode === 200) {
                    redirect_hash = querystring.stringify({
                        status: body.status,
                        id: body.id
                    });
                }
                else {
                    redirect_hash = querystring.stringify({
                        error: (body.error && body.error.message) 
                            ? body.error.message
                            : 'Unexpected HTTP response ' + sres.statusCode + ' from Stripe'
                    });                    
                }
                var redirect_url = context.data.callback + '#' + redirect_hash;
                res.writeHead(302, { Location: redirect_url });
                res.end();
                return callback();
            });
        }
    ], function (error) {
        if (error) {
            try {
                console.log('ERROR', error);
                res.writeHead(error.code || 500);
                res.end(error.stack || error.message || error.toString());
            }
            catch (e) {
                // ignore
            }
        }
    });
}

function error(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
}
