import { assign, isFunction } from 'lodash';
import express from 'express';
import sftpToS3FromList from './main';
import defaultConfig from '../config/default.config.json';

const app = express();

app.use((req, res, next) => {
  // eslint-disable-next-line no-param-reassign
  req.webtaskContext = generateWebtaskContext(defaultConfig.secret, defaultConfig.param);

  return next();
});

app.use('/', sftpToS3FromList);

app.listen(3000, () => {
  console.log('Listen on port 3000');
});

function generateWebtaskContext(secrets, params) {
  const context = {
    data: assign({}, secrets, params),
    body: secrets,
    storage: {
      memory: null,
      set(data, options, cb) {
        // eslint-disable-next-line no-param-reassign
        if (isFunction(options)) cb = options;
        this.memory = data;
        cb(null);
      },
      get(cb) {
        cb(null, this.memory);
      }
    }
  };

  return context;
}
