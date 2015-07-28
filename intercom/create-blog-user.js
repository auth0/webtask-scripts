var request = require('request');

module.exports = function(ctx, cb) {

  var attributes = {
    "blog_subs" : true
  };

  if (ctx.data.screen) {
    attributes.blog_subs_medium = 'twitter';
    attributes.twitter = ctx.data.screen;
    attributes.twitter_name = ctx.data.name;
  } else {
    attributes.blog_subs_medium = 'blog';
  }

  request.post({
    url: 'https://api.intercom.io/users',
    auth: {
      user: ctx.data.INTERCOM_USER,
      pass: ctx.data.INTERCOM_PASSWORD
    },
    json: {
      "email": ctx.data.email,
      "custom_attributes": attributes
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
