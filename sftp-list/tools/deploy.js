const fs = require('fs');
const _ = require('lodash');
const sandbox = require('sandboxjs');
const webtaskConfig = require('../config/webtask.config');
const defaultConfig = require('../config/default.config');

const config = _.assign({}, defaultConfig, webtaskConfig);

if (!config.WEBTASK_NAME) {
  throw new Error('error deploying webtask: Missing webtask name, please define the webtaskName');
}

if (!config.WEBTASK_TOKEN) {
  throw new Error('error deploying webtask: Missing webtask token, please define the webtaskToken');
}

const profile = sandbox.fromToken(config.WEBTASK_TOKEN);

fs.readFile('dist/webtask.js', (fsErr, code) => {
  if (fsErr) throw fsErr;

  profile.create(code.toString(), {
    name: config.WEBTASK_NAME,
    secrets: config.secret,
    params: config.param
  }, (sbErr, webtask) => {
    if (sbErr) throw sbErr;

    // eslint-disable-next-line no-console
    console.log(webtask.url);
  });
});
