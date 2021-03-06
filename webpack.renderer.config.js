const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    // filename: "[name].[contenthash].css",
    filename: "[name].css",
    allChunks: true,
    // disable: process.env.NODE_ENV === "development"
});

module.exports = {
  target: "electron-renderer",
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  entry: {
    renderer: path.join(__dirname, './src/renderer/index.ts')
  },
  output: {
    path: path.resolve(__dirname, './dist/'),
    libraryTarget: 'commonjs2',
    filename: '[name].js'
  },
  watchOptions: {
        poll: true
  },
  module: {
    rules: [
      {
        test: /\.(scss|sass|css)$/,
        use: extractSass.extract({
          use: [{
            loader: "css-loader"
          }, {
            loader: "sass-loader"
          }],
          // use style-loader in development
          fallback: "style-loader"
        })
      }, {
          test: /\.html$/,
          exclude: /node_modules/,
          loader: "html-loader?exportAsEs6Default"
      }, {
        test: /\.json$/,
        loader: 'json-loader'
      }, {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
        }
      }, {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', 'tsx', '.js', '.vue', '.json', 'scss', 'css', 'sass', 'html'],
    alias: {
      '@': path.join(__dirname, '../src/renderer'),
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map',
  plugins: [
    new HtmlWebpackPlugin({template: "./src/renderer/index.html"}),
    extractSass,
  ],
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
