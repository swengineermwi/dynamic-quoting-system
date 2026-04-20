const fs = require('fs');
const path = require('path');
const { get, list, put } = require('@vercel/blob');

const SUBMISSION_PREFIX = 'submitted-configurations/';

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

      accumulator[key] = rawValue.replace(/^['"]|['"]$/g, '');
      return accumulator;
    }, {});
}

function getBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  const localEnv = loadLocalEnv(path.resolve(__dirname, '..', '.env.local'));
  return localEnv.BLOB_READ_WRITE_TOKEN || '';
}

function getBlobOptions() {
  const token = getBlobToken();

  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN.');
  }

  return { token };
}

function sanitizePathSegment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'configuration';
}

function buildSubmissionPath(payload) {
  const submittedAt = payload.submittedAt || new Date().toISOString();
  const dateSegment = String(submittedAt).slice(0, 10);
  const quoteNumberSegment = sanitizePathSegment(payload.quoteNumber);
  const quoteIdSegment = sanitizePathSegment(payload.quoteId);

  return `${SUBMISSION_PREFIX}${dateSegment}/${quoteNumberSegment}-${quoteIdSegment}.json`;
}

async function readBlobJson(pathname) {
  const blobResponse = await get(pathname, {
    access: 'public',
    useCache: false,
    ...getBlobOptions(),
  });

  if (!blobResponse || blobResponse.statusCode !== 200) {
    return null;
  }

  const rawValue = await new Response(blobResponse.stream).text();
  return JSON.parse(rawValue);
}

function normalizeSubmissionRecord(record, blob) {
  return {
    id: record.id || `submission-${record.quoteId}`,
    quote: record.quote,
    quoteId: record.quoteId,
    quoteNumber: record.quoteNumber,
    submittedAt: record.submittedAt,
    total: record.total,
    blobPath: blob.pathname,
    blobUrl: blob.url,
    downloadUrl: blob.downloadUrl,
  };
}

async function readSubmissions() {
  const blobList = await list({
    limit: 50,
    prefix: SUBMISSION_PREFIX,
    ...getBlobOptions(),
  });
  const submissions = await Promise.all(
    blobList.blobs.map(async (blob) => {
      const record = await readBlobJson(blob.pathname);

      if (!record) {
        return null;
      }

      return normalizeSubmissionRecord(record, blob);
    }),
  );

  return submissions
    .filter(Boolean)
    .sort((left, right) => new Date(right.submittedAt) - new Date(left.submittedAt));
}

async function saveSubmission(payload) {
  const submissionRecord = {
    id: payload.id || `submission-${payload.quoteId}`,
    quote: payload.quote,
    quoteId: payload.quoteId,
    quoteNumber: payload.quoteNumber,
    submittedAt: payload.submittedAt,
    total: payload.total,
  };
  const blobResult = await put(
    buildSubmissionPath(submissionRecord),
    JSON.stringify(submissionRecord, null, 2),
    {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      ...getBlobOptions(),
    },
  );
  const submission = normalizeSubmissionRecord(submissionRecord, blobResult);
  const submissions = await readSubmissions();

  return {
    submission,
    submissions,
  };
}

module.exports = {
  buildSubmissionPath,
  readSubmissions,
  saveSubmission,
  sanitizePathSegment,
};
