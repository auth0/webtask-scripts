import _ from 'lodash';
import jenkinsRemoteApi from './webtask';
import defaultConfig from '../config/default.config.json';

const data = { data: _.assign({}, defaultConfig.secret, defaultConfig.param) };

jenkinsRemoteApi(data, (err, message) => {
  if (err) throw err;

  // eslint-disable-next-line no-console
  console.log(message);
});
