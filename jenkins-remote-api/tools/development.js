const nodemon = require('nodemon');
const _ = require('lodash');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');

const bundler = webpack(webpackConfig);
const runNodemon = _.once(() => nodemon('dist/node.js'));

bundler.watch({}, (err, stats) => {
  if (err) throw err;

  runNodemon();

  // eslint-disable-next-line no-console
  console.log(stats.toString());
});
