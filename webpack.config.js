const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV !== 'production' ? 'development' : 'production',
  entry: {
    devtools: './src/devtools.js',
    background: './src/background.js',
    panel: './src/panel.js',
    'main-app': './src/main-app.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  devtool: process.env.NODE_ENV !== 'production' ? '#inline-source-map' : false
};
