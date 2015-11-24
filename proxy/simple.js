var url = require('url');
module.exports = function (ctx, cb) {
  var whitelist = ['metrics.it.auth0.com']

  var tartetUrl = ctx.data.url;
  var target = url.parse(tartetUrl).hostname;
  var ok = whitelist.some(function (host) {
    return target === host;
  });

  if (!ok) {
    return cb(new Error('no way'));
  }

  request.get({url: tartetUrl}, function(err, resp, body) {
     if (err) return cb(err);
     cb(null, JSON.parse(body)); 
  });
};
