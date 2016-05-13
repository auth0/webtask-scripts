'use strict';

import _ from 'lodash';
import sftp2s3 from './index';
import defaultConfig from '../config/default.config.json';

const data = { data: _.assign({}, defaultConfig.secret, defaultConfig.param) };

sftp2s3(data, manageMessage);

function manageMessage(err, message) {
  if (err) {
    throw err;
  }

  /* eslint no-console: 0 */
  console.log(message.message);
}
