// Raw version of this file: https://raw.githubusercontent.com/auth0/webtask-scripts/master/s3/access_s3.js

var aws = require('aws-sdk');

return function (context, req, res) {

    // Validate and normalize parameters    

    var required_params = [
        'access_key_id', 'secret_access_key', 'get_regex', 'put_regex', 'region', 'path', 'bucket'
    ];
    for (var i in required_params) {
        if (typeof context.data[required_params[i]] !== 'string') {
            return error(400, 'Missing ' + required_params[i] + '.');
        }
    };

    context.data.method = context.data.method || 'get';
    if (context.data.method !== 'get' && context.data.method !== 'put') {
        return error(400, 'The `method` parameter must be `put` or `get`.');
    }

    // Authorize request

    var regexp = context.data[context.data.method + '_regex'];
    if (!(new RegExp(regexp)).test(context.data.path)) {
        console.log('Not authorized:', { regexp: regexp, path: context.data.path });
        return error(403, 'Not authorized');
    }

    console.log('Request: ', { 
        region: context.data.region, 
        bucket: context.data.bucket, 
        path: context.data.path, 
        method: context.data.method });

    // Configure AWS proxy

    aws.config.accessKeyId = context.data.access_key_id;
    aws.config.secretAccessKey = context.data.secret_access_key;
    aws.config.region = context.data.region;
    aws.config.sslEnabled = true;
    aws.config.logger = process.stdout;
    var s3 = new aws.S3({ params: { Bucket: context.data.bucket, Key: context.data.path }});

    if (context.data.method === 'get') {
        // Stream data from S3
        s3.getObject().createReadStream().pipe(res);
    }
    else {
        // Stream data to S3
        s3.upload({ Body: req }).send(function(err, data) {
            if (err) {
                return error(502, err.stack || err.message || err);
            } 
            else {
                console.log('Upload to S3 completed: ', data.Location);
                res.writeHead(200, { Location: data.Location });
                res.end();
            }
        });
    }

    return;

    function error(code, err) {
        try {
            console.log(code + ': ' + err);
            res.writeHead(code);
            res.end(err);
        }
        catch (e) {
            // ignore
        }
    }
};