const path = require('path');
const { entry } = require('./webpack.common.config');

module.exports = {
  mode: 'development',
  entry,
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  devtool: '#inline-source-map',
};
