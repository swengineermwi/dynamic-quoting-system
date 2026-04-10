const { put } = require('@vercel/blob');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  try {
    const chunks = [];

    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }

    const parsedBody = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    const { blobPath, quote, submittedAt = new Date().toISOString() } = parsedBody;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('Missing BLOB_READ_WRITE_TOKEN.');
    }

    if (!blobPath || !quote) {
      throw new Error('blobPath and quote are required.');
    }

    const blobBody = JSON.stringify({
      submittedAt,
      quote,
    }, null, 2);

    const blobResult = await put(blobPath, blobBody, {
      access: 'public',
      contentType: 'application/json',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    response.statusCode = 200;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({
      blobPath: blobResult.pathname,
      blobUrl: blobResult.url,
      byteLength: Buffer.byteLength(blobBody, 'utf8'),
      submittedAt,
    }));
  } catch (error) {
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ error: error.message }));
  }
};
