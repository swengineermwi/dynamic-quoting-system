const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSubmissionPath, sanitizePathSegment } = require('../server/submissionStore');

test('sanitizePathSegment creates blob-safe path segments', () => {
  assert.equal(sanitizePathSegment('QT-2026/04/20 001'), 'qt-2026-04-20-001');
  assert.equal(sanitizePathSegment('  '), 'configuration');
});

test('buildSubmissionPath creates a stable blob pathname for a submission', () => {
  const pathname = buildSubmissionPath({
    quoteId: 'quote-123',
    quoteNumber: 'QT-20260420-001',
    submittedAt: '2026-04-20T12:00:00.000Z',
  });

  assert.equal(
    pathname,
    'submitted-configurations/2026-04-20/qt-20260420-001-quote-123.json',
  );
});
