const nodemon = require('nodemon');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config');

webpack(webpackConfig).run(onBuild);

function onBuild(err, stats) {
  if (err) {
    throw err;
  }

  /* eslint no-console: 0 */
  console.log(stats.toString());
}

nodemon('dist/run.js');
