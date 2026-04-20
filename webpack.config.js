const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Template',
      template: './src/index.html',
    }),
  ],
  devServer: {
    static: './dist',
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        return middlewares;
      }

      devServer.app.post('/api/submit-quote', (request, response) => {
        let body = '';

        request.setEncoding('utf8');
        request.on('data', (chunk) => {
          body += chunk;
        });

        request.on('end', () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const quoteId = parsedBody.quoteId;
            const quoteNumber = parsedBody.quoteNumber;
            const submittedAt = parsedBody.submittedAt || new Date().toISOString();
            const total = parsedBody.total;

            if (!quoteId || !quoteNumber) {
              throw new Error('quoteId and quoteNumber are required.');
            }

            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({
              quoteId,
              quoteNumber,
              receiptId: `submission-${quoteId}`,
              submittedAt,
              total,
            }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({ error: error.message }));
          }
        });
      });

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
    filename: 'main.js',
    path: path.resolve(__dirname, 'public'),
  },
};
