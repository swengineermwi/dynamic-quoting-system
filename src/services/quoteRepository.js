const { MODULE_CATALOG, QUOTE_STATUSES } = require('../data/catalog');
const { SEEDED_QUOTE_INPUTS } = require('../data/seedQuotes');
const { buildQuoteRecord } = require('../domain/quoteEngine');

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMemoryStorage() {
  const storage = new Map();

  return {
    clear() {
      storage.clear();
    },
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    removeItem(key) {
      storage.delete(key);
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  };
}

class QuoteRepository {
  constructor(options = {}) {
    this.storage = options.storage || createMemoryStorage();
    this.storageKey = options.storageKey || 'dynamic-quoting-system-quotes-v1';
    this.catalog = options.catalog || MODULE_CATALOG;
    this.seedInputs = options.seedInputs || SEEDED_QUOTE_INPUTS;
    this.now = options.now || (() => new Date());
    this.idFactory = options.idFactory
      || (() => `quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  }

  ensureSeeded() {
    const existingPayload = this.storage.getItem(this.storageKey);

    if (existingPayload) {
      return;
    }

    const seededQuotes = this.seedInputs.map((seedInput, index) => {
      const record = buildQuoteRecord({
        catalog: this.catalog,
        draft: seedInput,
        mode: seedInput.status || 'generated',
        now: seedInput.createdAt || this.now(),
        quoteId: seedInput.id || this.idFactory(),
        quoteNumber: seedInput.quoteNumber || this.buildQuoteNumber(index + 1),
      });

      if (seedInput.createdAt) {
        record.createdAt = seedInput.createdAt;
      }

      if (seedInput.updatedAt) {
        record.updatedAt = seedInput.updatedAt;
      }

      return record;
    });

    this.writeQuotes(seededQuotes);
  }

  buildQuoteNumber(sequence) {
    const date = this.now();
    const isoDate = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10);
    const compactDate = isoDate.replace(/-/g, '');
    const paddedSequence = String(sequence).padStart(3, '0');

    return `QT-${compactDate}-${paddedSequence}`;
  }

  readQuotes() {
    this.ensureSeeded();

    const payload = this.storage.getItem(this.storageKey);

    if (!payload) {
      return [];
    }

    try {
      return JSON.parse(payload);
    } catch (error) {
      this.storage.removeItem(this.storageKey);
      return [];
    }
  }

  writeQuotes(quotes) {
    this.storage.setItem(this.storageKey, JSON.stringify(quotes));
  }

  listQuotes() {
    return cloneValue(
      this.readQuotes().sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)),
    );
  }

  getQuoteById(quoteId) {
    const quote = this.readQuotes().find((quoteRecord) => quoteRecord.id === quoteId);

    return quote ? cloneValue(quote) : null;
  }

  saveQuote(draft, options = {}) {
    const mode = options.mode || 'draft';
    const quotes = this.readQuotes();
    const existingQuote = options.quoteId
      ? quotes.find((quoteRecord) => quoteRecord.id === options.quoteId)
      : null;
    const nextSequence = existingQuote ? quotes.length : quotes.length + 1;
    const quoteRecord = buildQuoteRecord({
      catalog: this.catalog,
      draft,
      existingQuote,
      mode,
      now: this.now(),
      quoteId: existingQuote ? existingQuote.id : this.idFactory(),
      quoteNumber: existingQuote ? existingQuote.quoteNumber : this.buildQuoteNumber(nextSequence),
      submissionBlobPath: options.submissionBlobPath,
      submissionBlobUrl: options.submissionBlobUrl,
    });
    const nextQuotes = existingQuote
      ? quotes.map((quoteItem) => (quoteItem.id === existingQuote.id ? quoteRecord : quoteItem))
      : [...quotes, quoteRecord];

    this.writeQuotes(nextQuotes);

    return cloneValue(quoteRecord);
  }

  updateStatus(quoteId, status) {
    if (!QUOTE_STATUSES.includes(status)) {
      throw new Error(`Unsupported quote status "${status}".`);
    }

    const quotes = this.readQuotes();
    const existingQuote = quotes.find((quoteRecord) => quoteRecord.id === quoteId);

    if (!existingQuote) {
      throw new Error('Quote not found.');
    }

    const updatedQuote = {
      ...existingQuote,
      status,
      updatedAt: typeof this.now() === 'string' ? this.now() : this.now().toISOString(),
    };

    this.writeQuotes(
      quotes.map((quoteRecord) => (quoteRecord.id === quoteId ? updatedQuote : quoteRecord)),
    );

    return cloneValue(updatedQuote);
  }

  clearAll() {
    this.storage.removeItem(this.storageKey);
  }
}

function createQuoteRepository(options = {}) {
  return new QuoteRepository(options);
}

module.exports = {
  QuoteRepository,
  createMemoryStorage,
  createQuoteRepository,
};
