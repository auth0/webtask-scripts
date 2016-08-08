const path = require('path');
const _ = require('lodash');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

// Common configuration chunk to be used on all bundles
// webtask (webtask.js), and normal (node.js) bundles
const defaultConfig = {
  context: path.resolve(__dirname, '../src'),

  output: {
    path: path.join(__dirname, '../dist'),
    libraryTarget: 'commonjs2'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      include: path.join(__dirname, '../src')
    }, {
      test: /\.json$/,
      loader: 'json'
    }]
  },

  externals: [nodeExternals({
    whitelist: ['s3-upload-stream', 'replacestream']
  })],

  target: 'node',

  debug: true,

  devtool: 'source-map',

  plugins: [
    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true,
      entryOnly: false
    })
  ],

  stats: {
    colors: true
  }
};

// Configuration for the webtask bundle (webtask.js)
const indexConfig = _.merge({}, defaultConfig, {
  entry: ['./webtask'],

  output: {
    filename: 'webtask.js'
  }
});

// Configuration for the normal bundle (node.js)
const runConfig = _.merge({}, defaultConfig, {
  entry: ['./node'],

  output: {
    filename: 'node.js'
  }
});

module.exports = [indexConfig, runConfig];
