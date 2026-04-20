const { saveSubmission } = require('../server/submissionStore');

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
    const quote = parsedBody.quote || null;
    const quoteId = parsedBody.quoteId || quote?.id;
    const quoteNumber = parsedBody.quoteNumber || quote?.quoteNumber;
    const submittedAt = parsedBody.submittedAt || new Date().toISOString();
    const total = parsedBody.total ?? quote?.finalTotal ?? 0;

    if (!quote || !quoteId || !quoteNumber) {
      throw new Error('quote, quoteId, and quoteNumber are required.');
    }

    const savedPayload = await saveSubmission({
      id: `submission-${quoteId}`,
      quote,
      quoteId,
      quoteNumber,
      submittedAt,
      total,
    });

    response.statusCode = 200;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(savedPayload));
  } catch (error) {
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ error: error.message }));
  }
};
