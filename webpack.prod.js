const { resolve } = require('path');
const baseConf = require('./webpack.base');
const merge = require('webpack-merge');

const prodConf = {
  output: {
    path: resolve(__dirname, 'dist')
  },
  mode: 'production'
};

module.exports = merge(prodConf, baseConf);
