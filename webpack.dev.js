const { resolve } = require('path');
const baseConf = require('./webpack.base');
const merge = require('webpack-merge');

const devConf = {
  output: {
    path: resolve(__dirname, '../src/libs/trade-chart.js')
  },
  mode: 'development'
};

module.exports = merge(devConf, baseConf);
