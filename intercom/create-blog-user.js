var request = require('request');

module.exports = function(ctx, cb) {
  request.post({
    url: 'https://api.intercom.io/users',
    auth: {
      user: ctx.data.INTERCOM_USER,
      pass: ctx.data.INTERCOM_PASSWORD
    },
    json: {
      "email": ctx.data.email,
      "custom_attributes": {
        "blog_subs" : true
      }
    }
  }, function (err, resp, result) {
    if (err) {
      return cb(err);
    }

    if (resp.statusCode !== 200) {
      return cb(new Error(result));
    }

    return cb(null, result);
  });  
};
