const test = require('node:test');
const assert = require('node:assert/strict');

const { createEmptyQuoteDraft, quoteRecordToDraft } = require('../src/domain/quoteEngine');
const { QuoteRepository, createMemoryStorage } = require('../src/services/quoteRepository');

test('QuoteRepository seeds sample quotes when local storage is empty', () => {
  const repository = new QuoteRepository({
    storage: createMemoryStorage(),
  });

  const quotes = repository.listQuotes();

  assert.equal(quotes.length, 2);
  assert.equal(quotes[0].quoteType, 'implementation');
});

test('QuoteRepository saves drafts and submits an existing quote', () => {
  let index = 0;
  const timestamps = [
    '2026-04-08T08:00:00.000Z',
    '2026-04-08T08:10:00.000Z',
    '2026-04-08T08:20:00.000Z',
  ];
  const repository = new QuoteRepository({
    now: () => timestamps[index++] || timestamps[timestamps.length - 1],
    seedInputs: [],
    storage: createMemoryStorage(),
  });
  const draft = createEmptyQuoteDraft();

  draft.customerName = 'Acme Logistics';
  draft.projectName = 'Pilot implementation';
  draft.createdBy = 'user-amara-admin';
  draft.discountPercent = 2.5;

  const savedDraft = repository.saveQuote(draft, { mode: 'draft' });
  const updatedDraft = quoteRecordToDraft(savedDraft);

  updatedDraft.taxPercent = 16;

  const submittedQuote = repository.saveQuote(updatedDraft, {
    mode: 'submitted',
    quoteId: savedDraft.id,
  });

  assert.equal(savedDraft.status, 'draft');
  assert.equal(savedDraft.quoteNumber, 'QT-20260408-001');
  assert.equal(submittedQuote.status, 'submitted');
  assert.equal(submittedQuote.createdAt, savedDraft.createdAt);
  assert.equal(repository.listQuotes().length, 1);
});

test('QuoteRepository updates workflow status without changing quote identity', () => {
  const repository = new QuoteRepository({
    now: () => '2026-04-08T10:15:00.000Z',
    seedInputs: [],
    storage: createMemoryStorage(),
  });
  const draft = createEmptyQuoteDraft();

  draft.customerName = 'River Holdings';
  draft.projectName = 'Employer rollout';
  draft.createdBy = 'user-sara-sales';

  const savedQuote = repository.saveQuote(draft, { mode: 'submitted' });
  const approvedQuote = repository.updateStatus(savedQuote.id, 'approved');

  assert.equal(approvedQuote.id, savedQuote.id);
  assert.equal(approvedQuote.quoteNumber, savedQuote.quoteNumber);
  assert.equal(approvedQuote.status, 'approved');
});
