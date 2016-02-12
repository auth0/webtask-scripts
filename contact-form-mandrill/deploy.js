var Sandbox = require('sandboxjs');
var fs = require('fs');
var config = require('./config.json');

var profile = Sandbox.fromToken(config.webtaskToken);

fs.readFile('index.js', function (err, code) {
  if (err) {
    throw err;
  }

  profile.create(code.toString(), {
    secrets: config.secrets
  }, function (error, webtask) {
    if (error) {
      throw error;
    }

    /* eslint no-console: 0 */
    console.log(webtask.url);
  });
});
