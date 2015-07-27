var request = require('request');

function getAndCreateWithUserId(ctx, cb) {
  console.log("Getting userId with email", ctx.data.email)
  request.get({
    url: 'https://api.intercom.io/users?email=' + ctx.data.email,
    auth: {
      user: ctx.data.INTERCOM_USER,
      pass: ctx.data.INTERCOM_PASSWORD
    }
  }, function (err, resp, result) {
    console.log("Got response for userid", result);
    var userId = result.user_id;
    createWithUserId(ctx, cb, userId);
  });
}

function createWithUserId(ctx, cb, userId) {
  request.post({
    url: 'https://api.intercom.io/users',
    auth: {
      user: ctx.data.INTERCOM_USER,
      pass: ctx.data.INTERCOM_PASSWORD
    },
    json: {
      "user_id": userId,
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
}

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
      if (resp.statusCode === 400) {
        return getAndCreateWithUserId(ctx, cb);
      }
      console.log("Error", resp.statusCode, result);
      return cb(new Error(result));
    }

    console.log("All ok");
    return cb(null, result);
  });  
};
