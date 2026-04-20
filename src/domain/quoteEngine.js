const {
  DEFAULT_TEMPLATE_ID,
  MODULE_CATALOG,
  QUOTE_STATUSES,
  QUOTE_TEMPLATES,
  SUPPORTED_CURRENCIES,
  USER_OPTIONS,
} = require('../data/catalog');

const CORE_MODULE_CODE = 'SHARED_PLATFORM_CORE';
const MOBILE_MONEY_MODULE_CODE = 'MOBILE_MONEY_INTEGRATION';

function roundCurrency(value) {
  return Number((Number(value) || 0).toFixed(2));
}

function sanitizeText(value) {
  return String(value || '').trim();
}

function cloneSelections(moduleSelections, catalog = MODULE_CATALOG) {
  const fallbackSelections = buildModuleSelectionsFromTemplate(DEFAULT_TEMPLATE_ID, catalog);

  return catalog.reduce((accumulator, moduleConfig) => {
    const existingSelection = moduleSelections && moduleSelections[moduleConfig.code];
    const fallbackSelection = fallbackSelections[moduleConfig.code];

    accumulator[moduleConfig.code] = {
      included: Boolean(existingSelection ? existingSelection.included : fallbackSelection.included),
      selectedTier: sanitizeText(existingSelection ? existingSelection.selectedTier : fallbackSelection.selectedTier)
        || fallbackSelection.selectedTier,
    };

    return accumulator;
  }, {});
}

function findTemplateById(templateId, templates = QUOTE_TEMPLATES) {
  return templates.find((template) => template.id === templateId)
    || templates.find((template) => template.id === DEFAULT_TEMPLATE_ID)
    || templates[0];
}

function buildModuleSelectionsFromTemplate(
  templateId = DEFAULT_TEMPLATE_ID,
  catalog = MODULE_CATALOG,
  templates = QUOTE_TEMPLATES,
) {
  const template = findTemplateById(templateId, templates);

  return catalog.reduce((accumulator, moduleConfig) => {
    const templateConfig = template.defaultModuleTierMap[moduleConfig.code] || {};
    const defaultTier = moduleConfig.tiers[0].tierName;

    accumulator[moduleConfig.code] = {
      included: Boolean(templateConfig.included),
      selectedTier: sanitizeText(templateConfig.tier) || defaultTier,
    };

    return accumulator;
  }, {});
}

function createEmptyQuoteDraft(options = {}) {
  const templateId = options.templateId || DEFAULT_TEMPLATE_ID;

  return {
    customerName: '',
    projectName: '',
    currency: SUPPORTED_CURRENCIES[0],
    discountPercent: 0,
    taxPercent: 0,
    assumptions: '',
    createdBy: USER_OPTIONS[0].id,
    selectedTemplateId: templateId,
    moduleSelections: buildModuleSelectionsFromTemplate(templateId, MODULE_CATALOG, QUOTE_TEMPLATES),
  };
}

function quoteRecordToDraft(quoteRecord, catalog = MODULE_CATALOG) {
  if (!quoteRecord) {
    return createEmptyQuoteDraft();
  }

  return {
    customerName: quoteRecord.customerName || '',
    projectName: quoteRecord.projectName || '',
    currency: SUPPORTED_CURRENCIES[0],
    discountPercent: 0,
    taxPercent: 0,
    assumptions: quoteRecord.assumptions || '',
    createdBy: quoteRecord.createdBy || USER_OPTIONS[0].id,
    selectedTemplateId: quoteRecord.selectedTemplateId || DEFAULT_TEMPLATE_ID,
    moduleSelections: cloneSelections(quoteRecord.moduleSelections, catalog),
  };
}

function getModuleConfig(moduleCode, catalog = MODULE_CATALOG) {
  return catalog.find((moduleConfig) => moduleConfig.code === moduleCode);
}

function calculateSingleTotals(subtotal, discountPercent, taxPercent) {
  const safeSubtotal = roundCurrency(subtotal);
  const safeDiscountPercent = Number(discountPercent) || 0;
  const safeTaxPercent = Number(taxPercent) || 0;

  // Pricing formula:
  // 1. discounted subtotal = subtotal - (subtotal x discount%)
  // 2. tax = discounted subtotal x tax%
  // 3. final total = discounted subtotal + tax
  const discountAmount = roundCurrency(safeSubtotal * (safeDiscountPercent / 100));
  const discountedSubtotal = roundCurrency(safeSubtotal - discountAmount);
  const taxableBase = discountedSubtotal;
  const taxAmount = roundCurrency(taxableBase * (safeTaxPercent / 100));
  const finalTotal = roundCurrency(taxableBase + taxAmount);

  return {
    discountedSubtotal,
    discountAmount,
    finalTotal,
    taxAmount,
    taxableBase,
  };
}

function calculateQuotePricing(draft, catalog = MODULE_CATALOG) {
  const selections = cloneSelections(draft.moduleSelections, catalog);
  const lineItems = [];

  catalog.forEach((moduleConfig) => {
    const selection = selections[moduleConfig.code];

    if (!selection.included) {
      return;
    }

    const tierConfig = moduleConfig.tiers.find((tier) => tier.tierName === selection.selectedTier);

    if (!tierConfig) {
      return;
    }

    lineItems.push({
      id: `${moduleConfig.id}-${tierConfig.tierName.toLowerCase()}`,
      included: true,
      highCost: roundCurrency(tierConfig.highCost),
      lowCost: roundCurrency(tierConfig.lowCost),
      moduleCode: moduleConfig.code,
      moduleDescription: moduleConfig.description,
      moduleId: moduleConfig.id,
      moduleName: moduleConfig.name,
      quotedPrice: roundCurrency(tierConfig.lowCost),
      selectedTier: tierConfig.tierName,
      tierHighCost: roundCurrency(tierConfig.highCost),
      tierLowCost: roundCurrency(tierConfig.lowCost),
      tierDescription: tierConfig.description,
    });
  });

  const subtotal = roundCurrency(lineItems.reduce((sum, lineItem) => sum + lineItem.quotedPrice, 0));
  const totals = calculateSingleTotals(
    subtotal,
    draft.discountPercent,
    draft.taxPercent,
  );
  const hasCoreModule = Boolean(selections[CORE_MODULE_CODE] && selections[CORE_MODULE_CODE].included);
  const hasDependentModules = Object.keys(selections).some((moduleCode) => {
    if (moduleCode === CORE_MODULE_CODE || moduleCode === MOBILE_MONEY_MODULE_CODE) {
      return false;
    }

    return selections[moduleCode].included;
  });
  const warnings = [];

  if (hasDependentModules && !hasCoreModule) {
    warnings.push('Platform Core is typically included whenever other functional modules are quoted.');
  }

  return {
    discountAmount: totals.discountAmount,
    discountAmountHigh: totals.discountAmount,
    discountAmountLow: totals.discountAmount,
    discountedSubtotal: totals.discountedSubtotal,
    discountedSubtotalHigh: totals.discountedSubtotal,
    discountedSubtotalLow: totals.discountedSubtotal,
    finalTotal: totals.finalTotal,
    finalTotalHigh: totals.finalTotal,
    finalTotalLow: totals.finalTotal,
    lineItems,
    midpointTotal: totals.finalTotal,
    subtotal,
    subtotalHigh: subtotal,
    subtotalLow: subtotal,
    taxAmount: totals.taxAmount,
    taxAmountHigh: totals.taxAmount,
    taxAmountLow: totals.taxAmount,
    taxableBase: totals.taxableBase,
    taxableBaseHigh: totals.taxableBase,
    taxableBaseLow: totals.taxableBase,
    warnings,
  };
}

function validatePercentageField(value, label, errors) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 100) {
    errors.push(`${label} must be between 0 and 100.`);
  }
}

function validateQuoteDraft(draft, catalog = MODULE_CATALOG, options = {}) {
  const mode = options.mode || 'generated';
  const selections = cloneSelections(draft.moduleSelections, catalog);
  const pricing = calculateQuotePricing(draft, catalog);
  const errors = [];

  if (!sanitizeText(draft.createdBy)) {
    errors.push('Created by is required.');
  }

  if (!SUPPORTED_CURRENCIES.includes(draft.currency)) {
    errors.push('Currency must be one of the supported currencies.');
  }

  validatePercentageField(draft.discountPercent, 'Discount percent', errors);
  validatePercentageField(draft.taxPercent, 'Tax percent', errors);

  catalog.forEach((moduleConfig) => {
    const selection = selections[moduleConfig.code];

    if (!selection.included) {
      return;
    }

    const isTierValid = moduleConfig.tiers.some((tierConfig) => tierConfig.tierName === selection.selectedTier);

    if (!isTierValid) {
      errors.push(`${moduleConfig.name} must have a valid tier selected.`);
    }
  });

  if (pricing.lineItems.length === 0) {
    errors.push(
      mode === 'draft'
        ? 'Select at least one module before saving the draft.'
        : 'Select at least one module before submitting the quote.',
    );
  }

  return {
    errors,
    warnings: pricing.warnings,
  };
}

function buildQuoteRecord(options) {
  const {
    catalog = MODULE_CATALOG,
    draft,
    existingQuote = null,
    mode = 'draft',
    now = new Date(),
    quoteId,
    quoteNumber,
    submissionBlobPath = null,
    submissionBlobUrl = null,
  } = options;

  if (!QUOTE_STATUSES.includes(mode)) {
    throw new Error(`Unsupported quote status "${mode}".`);
  }

  const validation = validateQuoteDraft(draft, catalog, { mode });

  if (validation.errors.length > 0) {
    const error = new Error('Quote validation failed.');
    error.validationErrors = validation.errors;
    throw error;
  }

  const pricing = calculateQuotePricing(draft, catalog);
  const timestamp = typeof now === 'string' ? now : now.toISOString();

  return {
    assumptions: sanitizeText(draft.assumptions),
    createdAt: existingQuote ? existingQuote.createdAt : timestamp,
    createdBy: sanitizeText(draft.createdBy),
    currency: draft.currency,
    customerName: sanitizeText(draft.customerName),
    discountAmount: pricing.discountAmount,
    discountAmountHigh: pricing.discountAmountHigh,
    discountAmountLow: pricing.discountAmountLow,
    discountPercent: roundCurrency(draft.discountPercent),
    finalTotal: pricing.finalTotal,
    finalTotalHigh: pricing.finalTotalHigh,
    finalTotalLow: pricing.finalTotalLow,
    id: existingQuote ? existingQuote.id : quoteId,
    lineItems: pricing.lineItems,
    midpointTotal: pricing.midpointTotal,
    moduleSelections: cloneSelections(draft.moduleSelections, catalog),
    projectName: sanitizeText(draft.projectName),
    quoteNumber: existingQuote ? existingQuote.quoteNumber : quoteNumber,
    quoteType: 'implementation',
    selectedTemplateId: draft.selectedTemplateId || DEFAULT_TEMPLATE_ID,
    submissionBlobPath: submissionBlobPath || existingQuote?.submissionBlobPath || null,
    submissionBlobUrl: submissionBlobUrl || existingQuote?.submissionBlobUrl || null,
    submittedAt: mode === 'submitted'
      ? (existingQuote?.submittedAt || timestamp)
      : (existingQuote?.submittedAt || null),
    status: mode,
    subtotal: pricing.subtotal,
    subtotalHigh: pricing.subtotalHigh,
    subtotalLow: pricing.subtotalLow,
    taxAmount: pricing.taxAmount,
    taxAmountHigh: pricing.taxAmountHigh,
    taxAmountLow: pricing.taxAmountLow,
    taxPercent: roundCurrency(draft.taxPercent),
    updatedAt: timestamp,
    warnings: validation.warnings,
  };
}

module.exports = {
  CORE_MODULE_CODE,
  MOBILE_MONEY_MODULE_CODE,
  buildModuleSelectionsFromTemplate,
  buildQuoteRecord,
  calculateQuotePricing,
  createEmptyQuoteDraft,
  findTemplateById,
  getModuleConfig,
  quoteRecordToDraft,
  roundCurrency,
  validateQuoteDraft,
};
