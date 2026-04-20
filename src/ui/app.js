const {
  CLIENT_QUOTATION_DEFAULTS,
  DEFAULT_TEMPLATE_ID,
  MODULE_CATALOG,
  QUOTE_TEMPLATES,
} = require('../data/catalog');
const {
  buildModuleSelectionsFromTemplate,
  calculateQuotePricing,
  createEmptyQuoteDraft,
  quoteRecordToDraft,
  validateQuoteDraft,
} = require('../domain/quoteEngine');
const {
  escapeHtml,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMultilineText,
  formatStatus,
} = require('../lib/formatters');
const { createMemoryStorage, createQuoteRepository } = require('../services/quoteRepository');

function resolveStorage() {
  try {
    const probeKey = 'dynamic-quoting-system-storage-probe';
    window.localStorage.setItem(probeKey, probeKey);
    window.localStorage.removeItem(probeKey);

    return window.localStorage;
  } catch (error) {
    return createMemoryStorage();
  }
}

function parseHashRoute(hashValue) {
  const normalizedHash = hashValue.replace(/^#/, '') || '/builder';
  const routeSegments = normalizedHash.split('/').filter(Boolean);

  if (routeSegments.length === 0 || routeSegments[0] === 'builder') {
    return {
      name: 'builder',
      quoteId: routeSegments[1] || null,
    };
  }

  if (routeSegments[0] === 'quote' && routeSegments[1]) {
    return {
      name: 'detail',
      quoteId: routeSegments[1],
    };
  }

  return {
    name: 'builder',
    quoteId: null,
  };
}

function renderStatusBadge(status) {
  return `<span class="status-badge status-badge--${status}">${escapeHtml(formatStatus(status))}</span>`;
}

function renderNotice(notice) {
  if (!notice) {
    return '';
  }

  return `
    <div class="notice notice--${notice.type}">
      <strong>${notice.type === 'error' ? 'Validation issue' : 'Update ready'}</strong>
      <span>${escapeHtml(notice.message)}</span>
    </div>
  `;
}

function renderTemplateOptions(selectedTemplateId) {
  return QUOTE_TEMPLATES.map((template) => `
      <option value="${template.id}" ${selectedTemplateId === template.id ? 'selected' : ''}>
        ${escapeHtml(template.name)}
      </option>
    `).join('');
}

function getTierConfig(moduleConfig, selectedTier) {
  return moduleConfig.tiers.find((tierConfig) => tierConfig.tierName === selectedTier)
    || moduleConfig.tiers[0];
}

function renderTierOptions(moduleConfig, selectedTier, currency) {
  return moduleConfig.tiers.map((tierConfig) => `
      <option value="${tierConfig.tierName}" ${selectedTier === tierConfig.tierName ? 'selected' : ''}>
        ${escapeHtml(tierConfig.tierName)} - ${escapeHtml(formatCurrency(tierConfig.lowCost, currency))}
      </option>
    `).join('');
}

function renderTierGuide(moduleConfig, selectedTier, currency) {
  return `
    <details class="tier-guide">
      <summary>See what is included in each tier</summary>
      <div class="tier-guide__list">
        ${moduleConfig.tiers.map((tierConfig) => `
          <article class="tier-guide__item ${selectedTier === tierConfig.tierName ? 'tier-guide__item--selected' : ''}">
            <div class="tier-guide__heading">
              <strong>${escapeHtml(tierConfig.tierName)}</strong>
              <span>${formatCurrency(tierConfig.lowCost, currency)}</span>
            </div>
            <p>${escapeHtml(tierConfig.description)}</p>
          </article>
        `).join('')}
      </div>
    </details>
  `;
}

function renderConfigurationRows(modules, draft) {
  return modules.map((moduleConfig) => {
    const selection = draft.moduleSelections[moduleConfig.code];
    const included = Boolean(selection && selection.included);
    const selectedTier = selection ? selection.selectedTier : moduleConfig.tiers[0].tierName;
    const tierConfig = getTierConfig(moduleConfig, selectedTier);

    return `
      <tr class="builder-table__row ${included ? 'builder-table__row--included' : ''}" data-module-row="${moduleConfig.code}">
        <td class="builder-table__cell">
          <label class="toggle">
            <input
              type="checkbox"
              name="include_${moduleConfig.code}"
              ${included ? 'checked' : ''}
            >
            <span class="toggle__track"></span>
            <span class="toggle__label">${included ? 'Added' : 'Add'}</span>
          </label>
        </td>
        <td class="builder-table__cell">
          <strong>${escapeHtml(moduleConfig.name)}</strong>
        </td>
        <td class="builder-table__cell builder-table__cell--description">
          <div class="builder-table__meta">
            <p>${escapeHtml(moduleConfig.description)}</p>
            <span class="pill">${moduleConfig.isOptional ? 'Optional' : 'Core'}</span>
            ${renderTierGuide(moduleConfig, selectedTier, draft.currency)}
          </div>
        </td>
        <td class="builder-table__cell">
          <select
            class="input-select"
            name="tier_${moduleConfig.code}"
            ${included ? '' : 'disabled'}
            >
              ${renderTierOptions(moduleConfig, selectedTier, draft.currency)}
            </select>
          <small class="builder-table__tier-note">${escapeHtml(tierConfig.description)}</small>
        </td>
        <td class="builder-table__cell">
          <strong data-module-price="${moduleConfig.code}">${formatCurrency(tierConfig.lowCost, draft.currency)}</strong>
        </td>
      </tr>
    `;
  }).join('');
}

function renderMessageGroup(title, tone, items) {
  if (!items || items.length === 0) {
    return '';
  }

  return `
    <section class="message-card message-card--${tone}">
      <h3>${escapeHtml(title)}</h3>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderPricingSummary(pricingSnapshot, currency, draft) {
  if (!pricingSnapshot.lineItems.length) {
    return `
      <div class="empty-state empty-state--summary">
        <h3>No priced modules selected</h3>
        <p>Select at least one module and tier to generate a live estimate.</p>
      </div>
    `;
  }

  const totalRows = [
    {
      label: 'Subtotal',
      value: formatCurrency(pricingSnapshot.subtotal, currency),
    },
  ];

  if (Number(draft.discountPercent) > 0) {
    totalRows.push({
      label: `Discount (${escapeHtml(String(draft.discountPercent || 0))}%)`,
      value: `(${formatCurrency(pricingSnapshot.discountAmount, currency)})`,
    });
  }

  if (Number(draft.taxPercent) > 0) {
    totalRows.push({
      label: `Tax (${escapeHtml(String(draft.taxPercent || 0))}%)`,
      value: formatCurrency(pricingSnapshot.taxAmount, currency),
    });
  }

  totalRows.push({
    isFinal: true,
    label: 'Total quotation',
    value: formatCurrency(pricingSnapshot.finalTotal, currency),
  });

  return `
    ${renderLineItemTable(pricingSnapshot, currency)}

    <table class="summary-table">
      <tbody>
        ${totalRows.map((row) => `
          <tr class="${row.isFinal ? 'summary-table__final' : ''}">
            <th>${row.label}</th>
            <td>${row.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderLineItemTable(pricingSnapshot, currency) {
  return `
    <div class="table-shell">
      <table class="pricing-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Tier</th>
            <th>Quoted price</th>
          </tr>
        </thead>
        <tbody>
          ${pricingSnapshot.lineItems.map((lineItem) => `
            <tr>
              <td>
                <strong>${escapeHtml(lineItem.moduleName)}</strong>
                <small>${escapeHtml(lineItem.moduleDescription)}</small>
              </td>
              <td>
                <strong>${escapeHtml(lineItem.selectedTier)}</strong>
                <small>${escapeHtml(lineItem.tierDescription)}</small>
              </td>
              <td>${formatCurrency(lineItem.quotedPrice, currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderFloatingSummary(pricingSnapshot, currency) {
  if (!pricingSnapshot.lineItems.length) {
    return '';
  }

  return `
    <div class="floating-summary no-print" id="floating-summary">
      <div>
        <span>Subtotal</span>
        <strong>${formatCurrency(pricingSnapshot.subtotal, currency)}</strong>
      </div>
      <div>
        <span>Total quotation</span>
        <strong>${formatCurrency(pricingSnapshot.finalTotal, currency)}</strong>
      </div>
    </div>
  `;
}

function renderClientFacingTotals(quote) {
  const rows = [
    {
      label: 'Subtotal',
      value: formatCurrency(quote.subtotal, quote.currency),
    },
  ];

  if (Number(quote.discountAmount) > 0) {
    rows.push({
      label: `Discount (${quote.discountPercent}%)`,
      value: `(${formatCurrency(quote.discountAmount, quote.currency)})`,
    });
  }

  if (Number(quote.taxAmount) > 0) {
    rows.push({
      label: `Tax (${quote.taxPercent}%)`,
      value: formatCurrency(quote.taxAmount, quote.currency),
    });
  }

  rows.push({
    isFinal: true,
    label: 'Total quotation',
    value: formatCurrency(quote.finalTotal || quote.finalTotalLow, quote.currency),
  });

  return `
    <table class="summary-table">
      <tbody>
        ${rows.map((row) => `
          <tr class="${row.isFinal ? 'summary-table__final' : ''}">
            <th>${escapeHtml(row.label)}</th>
            <td>${escapeHtml(row.value)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderClientQuotationDocument(quote) {
  const projectName = quote.projectName || 'the selected implementation scope';
  const customerName = quote.customerName || 'Not specified';

  return `
    <section class="quotation-document panel">
      <header class="quotation-document__header">
        <div>
          <p class="eyebrow">Quotation</p>
          <h2>Software implementation quotation</h2>
          <p>This quotation covers the proposed implementation scope for ${escapeHtml(projectName)}.</p>
        </div>
        <div class="quotation-document__meta">
          <div>
            <span>Quotation no.</span>
            <strong>${escapeHtml(quote.quoteNumber)}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>${escapeHtml(formatDate(quote.updatedAt || quote.createdAt))}</strong>
          </div>
          <div>
            <span>Currency</span>
            <strong>${escapeHtml(quote.currency)}</strong>
          </div>
        </div>
      </header>

      <section class="quotation-document__block">
        <h3>Prepared for</h3>
        <div class="quotation-document__two-column">
          <div>
            <span>Client</span>
            <strong>${escapeHtml(customerName)}</strong>
          </div>
          <div>
            <span>Project</span>
            <strong>${escapeHtml(projectName)}</strong>
          </div>
        </div>
      </section>

      <section class="quotation-document__block">
        <h3>Proposed scope and pricing</h3>
        ${renderLineItemTable(quote, quote.currency)}
        ${renderClientFacingTotals(quote)}
      </section>

      <section class="quotation-document__block">
        <h3>Commercial terms</h3>
        <div class="quotation-document__two-column quotation-document__two-column--terms">
          <div>
            <span>Quotation validity</span>
            <strong>${CLIENT_QUOTATION_DEFAULTS.validityDays} days from issue date</strong>
          </div>
          <div>
            <span>Payment terms</span>
            <strong>${escapeHtml(CLIENT_QUOTATION_DEFAULTS.paymentTerms)}</strong>
          </div>
        </div>
      </section>

      <section class="quotation-document__block">
        <h3>Assumptions</h3>
        <p>${quote.assumptions ? formatMultilineText(quote.assumptions) : 'This quotation is based on the currently agreed implementation scope and standard delivery assumptions.'}</p>
      </section>

      <section class="quotation-document__block quotation-document__acceptance">
        <h3>Acceptance</h3>
        <p>${escapeHtml(CLIENT_QUOTATION_DEFAULTS.acceptanceNote)}</p>
        <div class="quotation-document__signoff">
          <div>
            <span>Client name</span>
            <div class="quotation-document__line"></div>
          </div>
          <div>
            <span>Signature</span>
            <div class="quotation-document__line"></div>
          </div>
          <div>
            <span>Date</span>
            <div class="quotation-document__line"></div>
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderBuilderView(state) {
  const draft = state.draft;
  const submitLabel = state.isSubmitting ? 'Submitting...' : 'Submit configuration';
  const submitButtonClass = `button button--primary ${state.isSubmitting ? 'button--loading' : ''}`;

  return `
    <form id="quote-builder-form" class="page-stack" novalidate>
      <section class="panel panel--section">
        <div class="field-grid builder-config-grid">
          <label class="field">
            <span>Package template</span>
            <select class="input-select" name="selectedTemplateId">
              ${renderTemplateOptions(draft.selectedTemplateId)}
            </select>
          </label>
        </div>
        <div class="builder-table-shell">
          <table class="builder-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Name</th>
                <th>Description</th>
                <th>Tier</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${renderConfigurationRows(MODULE_CATALOG, draft)}
            </tbody>
          </table>
        </div>
        <div id="builder-feedback">
          ${renderBuilderFeedback(state)}
        </div>
        <div class="builder-submit-bar">
          <div class="builder-submit-bar__total">
            <span>Total quotation</span>
            <strong>${escapeHtml(formatCurrency(state.preview.finalTotal, draft.currency))}</strong>
          </div>
          <div class="panel-actions">
            <button
              type="button"
              class="${submitButtonClass}"
              data-action="submit-quote"
              ${state.isSubmitting ? 'disabled aria-busy="true"' : ''}
            >
              <span class="button__spinner" aria-hidden="true"></span>
              <span class="button__label">${escapeHtml(submitLabel)}</span>
            </button>
          </div>
        </div>
      </section>
    </form>
  `;
}

function renderBuilderFeedback(state) {
  const validationErrors = state.submissionErrors.length
    ? state.submissionErrors
    : state.validation.errors;

  return `
    ${renderMessageGroup('Validation checks', 'error', validationErrors)}
    ${renderMessageGroup('Quotation warnings', 'warning', state.preview.warnings)}
  `;
}

function renderQuoteDetailView(quote) {
  if (!quote) {
    return `
      <section class="panel">
        <div class="empty-state">
          <h2>Quote not found</h2>
          <p>The requested quote could not be loaded from local storage.</p>
          <button type="button" class="button button--primary" data-action="new-quote">Back to builder</button>
        </div>
      </section>
    `;
  }

  return `
    <section class="panel panel--section no-print">
      <div class="panel-heading">
        <div>
          <h2>Quote actions</h2>
        </div>
      </div>
      <div class="panel-actions">
        ${quote.status !== 'submitted' && quote.status !== 'approved' && quote.status !== 'archived' ? `<button type="button" class="button button--primary" data-action="submit-quote" data-quote-id="${quote.id}">Submit quote</button>` : ''}
        ${quote.status !== 'approved' ? `<button type="button" class="button button--primary" data-action="set-status" data-status="approved" data-quote-id="${quote.id}">Mark approved</button>` : ''}
        ${quote.status !== 'archived' ? `<button type="button" class="button button--ghost" data-action="set-status" data-status="archived" data-quote-id="${quote.id}">Archive quote</button>` : ''}
        <button type="button" class="button button--ghost" data-action="new-quote">New quotation</button>
        <button type="button" class="button button--ghost" data-action="edit-quote" data-quote-id="${quote.id}">Edit quote</button>
      </div>
      <div class="detail-grid">
        <article class="detail-card">
          <span>Status</span>
          <strong>${renderStatusBadge(quote.status)}</strong>
        </article>
        <article class="detail-card">
          <span>Last updated</span>
          <strong>${escapeHtml(formatDateTime(quote.updatedAt))}</strong>
        </article>
        ${quote.submittedAt ? `
          <article class="detail-card">
            <span>Submitted</span>
            <strong>${escapeHtml(formatDateTime(quote.submittedAt))}</strong>
          </article>
        ` : ''}
      </div>
        ${quote.submissionBlobUrl ? `
        <section class="quotation-document__block">
          <h3>Submission record</h3>
          <p>
            Private Blob reference:
            <a href="${escapeHtml(quote.submissionBlobUrl)}" target="_blank" rel="noreferrer">${escapeHtml(quote.submissionBlobUrl)}</a>
          </p>
        </section>
      ` : ''}
      ${renderMessageGroup('Quote warnings', 'warning', quote.warnings)}
    </section>

    ${renderClientQuotationDocument(quote)}
  `;
}

function buildSubmissionPath(quote) {
  const quoteNumber = String(quote.quoteNumber || 'quote').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `quotes/${quoteNumber}-${quote.id}.json`;
}

function buildSubmissionPayload(quote) {
  return JSON.stringify({
    submittedAt: new Date().toISOString(),
    quote,
  }, null, 2);
}

function renderShell(state, route, content) {
  return `
    <div class="shell">
      <main class="main-content">
        ${renderNotice(state.notice)}
        ${content}
      </main>
    </div>
  `;
}

function createQuoteApp(rootElement) {
  const state = {
    currentBuilderQuoteId: null,
    currentRoute: null,
    draft: createEmptyQuoteDraft(),
    notice: null,
    preview: calculateQuotePricing(createEmptyQuoteDraft()),
    repository: createQuoteRepository({
      storage: resolveStorage(),
    }),
    isSubmitting: false,
    submissionErrors: [],
    validation: validateQuoteDraft(createEmptyQuoteDraft()),
  };

  function setNotice(type, message) {
    state.notice = { type, message };
  }

  function logSubmitStep(step, details = {}) {
    console.log(`[quote-submit] ${step}`, details);
  }

  function updateDraftDerivedState() {
    state.preview = calculateQuotePricing(state.draft);
    state.validation = validateQuoteDraft(state.draft);
  }

  function loadDraftForRoute(quoteId) {
    if (!quoteId) {
      state.currentBuilderQuoteId = null;
      state.draft = createEmptyQuoteDraft();
      state.submissionErrors = [];
      updateDraftDerivedState();
      return;
    }

    const storedQuote = state.repository.getQuoteById(quoteId);

    if (!storedQuote) {
      setNotice('error', 'That quote could not be loaded from local storage.');
      state.currentBuilderQuoteId = null;
      state.draft = createEmptyQuoteDraft();
      state.submissionErrors = [];
      updateDraftDerivedState();
      return;
    }

    state.currentBuilderQuoteId = quoteId;
    state.draft = quoteRecordToDraft(storedQuote);
    state.submissionErrors = [];
    updateDraftDerivedState();
  }

  function navigate(hash) {
    if (window.location.hash === hash) {
      renderCurrentRoute();
      return;
    }

    window.location.hash = hash;
  }

  function renderCurrentRoute() {
    state.currentRoute = parseHashRoute(window.location.hash);

    if (state.currentRoute.name === 'builder') {
      loadDraftForRoute(state.currentRoute.quoteId);
      rootElement.innerHTML = renderShell(state, state.currentRoute, renderBuilderView(state));
      syncBuilderPanels();
      return;
    }

    if (state.currentRoute.name === 'detail') {
      const quote = state.repository.getQuoteById(state.currentRoute.quoteId);
      rootElement.innerHTML = renderShell(state, state.currentRoute, renderQuoteDetailView(quote));
      return;
    }

    navigate('#/builder');
    return;
  }

  function refreshBuilderRowState() {
    const form = rootElement.querySelector('#quote-builder-form');

    if (!form) {
      return;
    }

    MODULE_CATALOG.forEach((moduleConfig) => {
      const row = form.querySelector(`[data-module-row="${moduleConfig.code}"]`);
      const checkbox = form.elements[`include_${moduleConfig.code}`];
      const tierSelect = form.elements[`tier_${moduleConfig.code}`];
      const isIncluded = Boolean(checkbox && checkbox.checked);
      const selection = state.draft.moduleSelections[moduleConfig.code];
      const tierConfig = getTierConfig(moduleConfig, selection ? selection.selectedTier : moduleConfig.tiers[0].tierName);
      const priceNode = form.querySelector(`[data-module-price="${moduleConfig.code}"]`);
      const toggleLabel = row ? row.querySelector('.toggle__label') : null;
      const tierNote = row ? row.querySelector('.builder-table__tier-note') : null;

      if (row) {
        row.classList.toggle('builder-table__row--included', isIncluded);
      }

      if (tierSelect) {
        tierSelect.disabled = !isIncluded;
      }

      if (priceNode) {
        priceNode.textContent = formatCurrency(tierConfig.lowCost, state.draft.currency);
      }

      if (toggleLabel) {
        toggleLabel.textContent = isIncluded ? 'Added' : 'Add';
      }

      if (tierNote) {
        tierNote.textContent = tierConfig.description;
      }
    });
  }

  function syncBuilderPanels() {
    refreshBuilderRowState();

    const feedbackNode = rootElement.querySelector('#builder-feedback');
    const submitBarTotalNode = rootElement.querySelector('.builder-submit-bar__total strong');

    if (feedbackNode) {
      feedbackNode.innerHTML = renderBuilderFeedback(state);
    }

    if (submitBarTotalNode) {
      submitBarTotalNode.textContent = formatCurrency(state.preview.finalTotal, state.draft.currency);
    }
  }

  function syncDraftFromForm() {
    const form = rootElement.querySelector('#quote-builder-form');

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const moduleSelections = MODULE_CATALOG.reduce((accumulator, moduleConfig) => {
      accumulator[moduleConfig.code] = {
        included: formData.get(`include_${moduleConfig.code}`) === 'on',
        selectedTier: formData.get(`tier_${moduleConfig.code}`) || moduleConfig.tiers[0].tierName,
      };

      return accumulator;
    }, {});

    state.draft = {
      assumptions: state.draft.assumptions,
      customerName: state.draft.customerName,
      createdBy: state.draft.createdBy,
      currency: state.draft.currency,
      discountPercent: state.draft.discountPercent,
      moduleSelections,
      projectName: state.draft.projectName,
      selectedTemplateId: String(formData.get('selectedTemplateId') || DEFAULT_TEMPLATE_ID),
      taxPercent: state.draft.taxPercent,
    };

    state.submissionErrors = [];
    updateDraftDerivedState();
    syncBuilderPanels();
  }

  function applyTemplate(templateId) {
    state.draft = {
      ...state.draft,
      moduleSelections: buildModuleSelectionsFromTemplate(templateId),
      selectedTemplateId: templateId,
    };
    state.submissionErrors = [];
    updateDraftDerivedState();
    rootElement.innerHTML = renderShell(state, { name: 'builder', quoteId: state.currentBuilderQuoteId }, renderBuilderView(state));
    syncBuilderPanels();
  }

  function persistQuote(mode) {
    syncDraftFromForm();

    try {
      const savedQuote = state.repository.saveQuote(state.draft, {
        mode,
        quoteId: state.currentBuilderQuoteId,
      });

      state.currentBuilderQuoteId = savedQuote.id;
      state.draft = quoteRecordToDraft(savedQuote);
      state.submissionErrors = [];
      updateDraftDerivedState();
      setNotice(
        'success',
        mode === 'draft'
          ? `${savedQuote.quoteNumber} saved locally in this browser.`
          : `${savedQuote.quoteNumber} submitted successfully.`,
      );

      if (mode === 'submitted') {
        navigate(`#/quote/${savedQuote.id}`);
        return;
      }

      navigate(`#/builder/${savedQuote.id}`);
    } catch (error) {
      state.submissionErrors = error.validationErrors || [error.message];
      setNotice('error', state.submissionErrors.join(' '));
      syncBuilderPanels();
    }
  }

  async function submitQuote(mode = 'submitted', quoteId = null) {
    if (state.isSubmitting) {
      return;
    }

    logSubmitStep('submit-start', {
      mode,
      quoteId,
      currentBuilderQuoteId: state.currentBuilderQuoteId,
    });
    state.isSubmitting = true;
    syncBuilderPanels();
    syncDraftFromForm();
    logSubmitStep('draft-synced', {
      customerName: state.draft.customerName,
      projectName: state.draft.projectName,
      selectedTemplateId: state.draft.selectedTemplateId,
      moduleCount: Object.values(state.draft.moduleSelections).filter((selection) => selection.included).length,
    });

    try {
      logSubmitStep('saving-draft-quote');
      const draftQuote = state.repository.saveQuote(state.draft, {
        mode,
        quoteId: quoteId || state.currentBuilderQuoteId,
      });
      logSubmitStep('draft-quote-saved', {
        id: draftQuote.id,
        quoteNumber: draftQuote.quoteNumber,
        status: draftQuote.status,
      });

      const blobPath = buildSubmissionPath(draftQuote);
      const submissionPayload = buildSubmissionPayload(draftQuote);
      logSubmitStep('submit-request-start', {
        endpoint: '/api/submit-quote',
        blobPath,
        payloadSize: submissionPayload.length,
      });
      const response = await fetch('/api/submit-quote', {
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          blobPath,
          quote: draftQuote,
          submittedAt: new Date().toISOString(),
        }),
      });
      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseBody.error || `Submission failed with status ${response.status}.`);
      }

      logSubmitStep('submit-request-complete', responseBody);

      logSubmitStep('persist-submission-metadata');
      const savedQuote = state.repository.saveQuote(state.draft, {
        mode,
        quoteId: draftQuote.id,
        submissionBlobPath: responseBody.blobPath || blobPath,
        submissionBlobUrl: responseBody.blobUrl || null,
      });
      logSubmitStep('submission-metadata-saved', {
        id: savedQuote.id,
        quoteNumber: savedQuote.quoteNumber,
        submissionBlobPath: savedQuote.submissionBlobPath,
        submissionBlobUrl: savedQuote.submissionBlobUrl,
      });

      state.currentBuilderQuoteId = savedQuote.id;
      state.draft = quoteRecordToDraft(savedQuote);
      state.submissionErrors = [];
      updateDraftDerivedState();
      logSubmitStep('submit-success', {
        quoteId: savedQuote.id,
        quoteNumber: savedQuote.quoteNumber,
      });
      state.notice = null;
      window.alert('Successfully submitted configuration.');
      navigate('#/builder');
    } catch (error) {
      logSubmitStep('submit-failed', {
        message: error.message,
        validationErrors: error.validationErrors || null,
      });
      state.submissionErrors = error.validationErrors || [error.message];
      setNotice('error', state.submissionErrors.join(' '));
      syncBuilderPanels();
    } finally {
      state.isSubmitting = false;
      syncBuilderPanels();
    }
  }

  function updateQuoteStatus(quoteId, status) {
    try {
      const updatedQuote = state.repository.updateStatus(quoteId, status);
      setNotice('success', `${updatedQuote.quoteNumber} marked as ${formatStatus(status).toLowerCase()}.`);
      renderCurrentRoute();
    } catch (error) {
      setNotice('error', error.message);
      renderCurrentRoute();
    }
  }

  rootElement.addEventListener('click', async (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.action;
    const quoteId = actionTarget.dataset.quoteId;
    const nextStatus = actionTarget.dataset.status;

    if (action === 'new-quote') {
      state.notice = null;
      state.currentBuilderQuoteId = null;
      state.draft = createEmptyQuoteDraft();
      state.submissionErrors = [];
      updateDraftDerivedState();
      navigate('#/builder');
      return;
    }

    if (action === 'edit-quote') {
      navigate(`#/builder/${quoteId}`);
      return;
    }

    if (action === 'submit-quote') {
      if (state.currentRoute && state.currentRoute.name === 'detail' && quoteId) {
        const existingQuote = state.repository.getQuoteById(quoteId);

        if (!existingQuote) {
          setNotice('error', 'That quote could not be loaded from local storage.');
          renderCurrentRoute();
          return;
        }

        state.currentBuilderQuoteId = existingQuote.id;
        state.draft = quoteRecordToDraft(existingQuote);
        state.submissionErrors = [];
        updateDraftDerivedState();
      }

      await submitQuote('submitted', quoteId);
      return;
    }

    if (action === 'set-status') {
      updateQuoteStatus(quoteId, nextStatus);
      return;
    }

  });

  rootElement.addEventListener('change', (event) => {
    if (!event.target.closest('#quote-builder-form')) {
      return;
    }

    if (event.target.name === 'selectedTemplateId') {
      applyTemplate(event.target.value);
      return;
    }

    syncDraftFromForm();
  });

  rootElement.addEventListener('input', (event) => {
    if (!event.target.closest('#quote-builder-form')) {
      return;
    }

    if (event.target.name === 'selectedTemplateId') {
      return;
    }

    syncDraftFromForm();
  });

  window.addEventListener('hashchange', renderCurrentRoute);

  if (!window.location.hash) {
    window.location.hash = '#/builder';
    return;
  }

  renderCurrentRoute();
}

module.exports = {
  createQuoteApp,
};
