const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const webpack = require('webpack');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// We need to exclude node_modules, otherwise webpack will bundle them
const nodeModules = {};

fs.readdirSync('node_modules')
  .filter(x => ['.bin'].indexOf(x) === -1)
  .forEach(mod => {
    nodeModules[mod] = `commonjs ${mod}`;
  });

const nodeModulesIndex = _.assign({}, nodeModules);

delete nodeModulesIndex.replacestream;
delete nodeModulesIndex['s3-upload-stream'];

// Common configuration chunk to be used on all bundles
// webtask (index.js), and local (run.js) bundles
const defaultConfig = {
  target: 'node',
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      include: path.join(__dirname, 'src')
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({ minimize: true })
  ]
};

// This adds source-map-support in orded to enable debugging ES6 files
if (process.env.NODE_ENV === 'development') {
  defaultConfig.devtool = 'source-map';
  defaultConfig.debug = true;
  defaultConfig.plugins
    .push(new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true,
      entryOnly: false
    }));
}

// Configuration for the webtask bundle (index.js)
const indexConfig = _.assign({}, defaultConfig, {
  entry: ['./src/index'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  externals: nodeModulesIndex
});

// Configuration for the normal bundle (index.js)
const runConfig = _.assign({}, defaultConfig, {
  entry: ['./src/run'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'run.js'
  },
  externals: nodeModules
});

module.exports = [indexConfig, runConfig];
