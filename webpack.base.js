const { resolve } = require('path')
const nimiCssExtractPlugin = require('mini-css-extract-plugin') //分割css
console.log(nimiCssExtractPlugin)
const optimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin') //压缩css
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  entry: resolve(__dirname, 'src/TradeChart.ts'),
  output: {
    filename: 'index.js',
    libraryTarget: 'umd', //通用模块化
    library: 'TradeChart',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: [nimiCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
      },
      {
        test: /\.(jpg|png|gif)$/,
        loader: 'url-loader',
        options: {
          esModule: false,
          limit: 8 * 1024
        }
      }
    ]
  },
  plugins: [
    new nimiCssExtractPlugin({ filename: 'css/built.css' }),
    new optimizeCssAssetsWebpackPlugin(),
    new CleanWebpackPlugin()
  ]
}
