const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const submitQuoteHandler = require('./api/submit-quote');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.js',
    demo: './src/demo-workflow/index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Template',
      template: './src/index.html',
      filename: 'index.html',
      chunks: ["main"]
    }),
    new HtmlWebpackPlugin({
      title: 'Demo',
      template: './src/demo-workflow/index.html',
      filename: 'demo-workflow/index.html',
      chunks: ["demo"]
    }),
  ],
  devServer: {
    static: './dist',
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        return middlewares;
      }

      devServer.app.all('/api/submit-quote', (request, response) => submitQuoteHandler(request, response));

      return middlewares;
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public'),
  },
};
