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
    const {
      quoteId,
      quoteNumber,
      submittedAt = new Date().toISOString(),
      total,
    } = parsedBody;

    if (!quoteId || !quoteNumber) {
      throw new Error('quoteId and quoteNumber are required.');
    }

    response.statusCode = 200;
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
};
