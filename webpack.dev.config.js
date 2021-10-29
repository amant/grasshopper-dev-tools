const path = require('path');
const { entry, module : webpackModule } = require('./webpack.common.config');

module.exports = {
  mode: 'development',
  entry,
  module: webpackModule,
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  devtool: 'inline-source-map',
};
