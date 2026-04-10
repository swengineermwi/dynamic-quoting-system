const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { put } = require('@vercel/blob');

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((accumulator, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return accumulator;
      }

      const equalsIndex = trimmedLine.indexOf('=');

      if (equalsIndex === -1) {
        return accumulator;
      }

      const key = trimmedLine.slice(0, equalsIndex).trim();
      const rawValue = trimmedLine.slice(equalsIndex + 1).trim();
      const unquotedValue = rawValue.replace(/^['"]|['"]$/g, '');

      accumulator[key] = unquotedValue;
      return accumulator;
    }, {});
}

const localEnv = loadLocalEnv(path.resolve(__dirname, '.env.local'));
const blobToken = localEnv.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || '';

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

        request.on('end', async () => {
          try {
            if (!blobToken) {
              throw new Error('Missing BLOB_READ_WRITE_TOKEN for Blob submission.');
            }

            const parsedBody = body ? JSON.parse(body) : {};
            const blobPath = parsedBody.blobPath;
            const quote = parsedBody.quote;
            const submittedAt = parsedBody.submittedAt || new Date().toISOString();

            if (!blobPath || !quote) {
              throw new Error('blobPath and quote are required.');
            }

            const blobResult = await put(blobPath, JSON.stringify({
              submittedAt,
              quote,
            }, null, 2), {
              token: blobToken,
              access: 'public',
              contentType: 'application/json',
            });

            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({
              blobPath: blobResult.pathname,
              blobUrl: blobResult.url,
              submittedAt,
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
