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
      console.log("Error", err);
      return cb(err);
    }

    if (resp.statusCode < 200 || resp.statusCode > 299) {
      console.log("Error", resp.statusCode, result);
      return cb(new Error(result));
    }

    console.log("All ok");
    return cb(null, result);
  });  
};
