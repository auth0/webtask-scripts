// Raw version of this file: 

var aws = require('aws-sdk');

return function (context, req, res) {

    // Validate and normalize parameters    

    var required_params = [
        'access_key_id', 'secret_access_key', 'get_regex', 'put_regex', 'region', 'path'
    ];
    for (var i in required_params) {
        if (typeof context.data[required_params[i]] !== 'string') {
            return error(400, 'Missing ' + required_params[i] + '.');
        }
    });

    context.data.method = context.data.method || 'get';
    if (context.data.method !== 'get' && context.data.method !== 'put') {
        return error(400, 'The `method` parameter must be `put` or `get`.');
    }

    var i = context.data.path.indexOf('/');
    if (i <= 0) {
        return error(400, 'The `path` parameter must be of the form {bucket}/{key}.');
    }
    else {
        context.data.bucket = context.data.path.substring(0, i);
        context.data.key = context.data.path.substring(i + 1);
    }

    // Authorize request

    if (!(new RegExp(context.data[context.data.method + '_regex'])).test(context.data.path)) {
        return error(403, 'Not authorized');
    }

    // Configure AWS proxy

    aws.config.accessKeyId = context.data.access_key_id;
    aws.config.secretAccessKey = context.data.secret_access_key;
    aws.config.region = context.data.region;
    aws.config.sslEnabled = true;
    aws.config.logger = process.stdout;
    var s3 = new aws.S3({ params: { Bucket: context.data.bucket, Key: context.data.key }});

    if (context.data.method === 'get') {
        // Stream data from S3
        s3.getObject(s3_params).createReadStream().pipe(res);
    }
    else {
        // Stream data to S3
        s3.upload({ Body: req })
            .once('httpDone', function () {
                res.writeHead(200);
                res.end();
            })
            .once('error', function (error) {
                return error(500, error.stack || error.message || error.toString());
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