const Sandbox = require('sandboxjs');
const webtaskConfig = require('../config/webtask.config');
const defaultConfig = require('../config/default.config');
const fs = require('fs');
const _ = require('lodash');

const config = _.assign({}, defaultConfig, webtaskConfig);

if (!config.webtaskName) {
  throw new Error('error deploying webtask: Missing webtask name, please define the webtaskName');
}

if (!config.webtaskToken) {
  throw new Error('error deploying webtask: Missing webtask token, please define the webtaskToken');
}

const profile = Sandbox.fromToken(config.webtaskToken);

fs.readFile('dist/index.js', (err, code) => {
  if (err) {
    throw err;
  }

  profile.create(code.toString(), {
    name: config.webtaskName,
    secrets: config.secret,
    params: config.param
  }, (error, webtask) => {
    if (error) {
      throw error;
    }

    /* eslint no-console: 0 */

    console.log(webtask.url);
  });
});
