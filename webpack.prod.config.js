const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const { entry, module: webpackModule } = require('./webpack.common.config');

const distDirPath = path.join(__dirname, 'dist');

module.exports = {
  mode: 'production',
  entry,
  module: webpackModule,
  output: {
    path: path.join(distDirPath, 'build'),
    filename: '[name].js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        'manifest.json',
        'devtools.html',
        'panel.html',
        'assets/**/*'
      ].map(srcPath => ({ from: srcPath, to: distDirPath }))
    }),
  ],
  devtool: false
};
