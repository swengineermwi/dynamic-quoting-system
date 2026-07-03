const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildModuleSelectionsFromTemplate,
  calculateQuotePricing,
  createEmptyQuoteDraft,
  validateQuoteDraft,
} = require('../src/domain/quoteEngine');

test('calculateQuotePricing uses the starting tier value and applies discount and tax in order', () => {
  const draft = createEmptyQuoteDraft();

  draft.customerName = 'Acme Manufacturing';
  draft.projectName = 'Core rollout';
  draft.createdBy = 'user-sara-sales';
  draft.discountPercent = 10;
  draft.taxPercent = 16;

  const pricing = calculateQuotePricing(draft);

  assert.equal(pricing.lineItems[0].quotedPrice, 12000);
  assert.equal(pricing.subtotal, 12000);
  assert.equal(pricing.discountAmount, 1200);
  assert.equal(pricing.taxAmount, 1728);
  assert.equal(pricing.finalTotal, 12528);
  assert.equal(pricing.midpointTotal, 12528);
});

test('calculateQuotePricing includes the AI Intelligence Module using the selected AI tier price', () => {
  const draft = createEmptyQuoteDraft();

  draft.customerName = 'Kasama Industries';
  draft.projectName = 'AI-assisted rollout';
  draft.moduleSelections = buildModuleSelectionsFromTemplate('custom-package');
  draft.moduleSelections.AI_INTELLIGENCE_MODULE.included = true;
  draft.moduleSelections.AI_INTELLIGENCE_MODULE.selectedTier = 'AI Decisioning';

  const pricing = calculateQuotePricing(draft);
  const aiLineItem = pricing.lineItems.find((lineItem) => lineItem.moduleCode === 'AI_INTELLIGENCE_MODULE');

  assert.ok(aiLineItem);
  assert.equal(aiLineItem.selectedTier, 'AI Decisioning');
  assert.equal(aiLineItem.quotedPrice, 15000);
  assert.equal(pricing.subtotal, 27000);
  assert.equal(pricing.finalTotal, 27000);
});

test('calculateQuotePricing warns when other modules are included without shared core', () => {
  const draft = createEmptyQuoteDraft();

  draft.customerName = 'BlueRock';
  draft.projectName = 'Custom rollout';
  draft.createdBy = 'user-amara-admin';
  draft.moduleSelections = buildModuleSelectionsFromTemplate('custom-package');
  draft.moduleSelections.SHARED_PLATFORM_CORE.included = false;
  draft.moduleSelections.ADMIN.included = true;

  const pricing = calculateQuotePricing(draft);

  assert.equal(pricing.lineItems.length, 1);
  assert.equal(pricing.lineItems[0].moduleCode, 'ADMIN');
  assert.equal(pricing.warnings.length, 1);
  assert.match(pricing.warnings[0], /Platform Core/);
});

test('package templates set the AI module to the expected recommended tier', () => {
  const basicSelections = buildModuleSelectionsFromTemplate('basic-package');
  const standardSelections = buildModuleSelectionsFromTemplate('standard-package');
  const advancedSelections = buildModuleSelectionsFromTemplate('advanced-package');

  assert.deepEqual(basicSelections.AI_INTELLIGENCE_MODULE, {
    included: false,
    selectedTier: 'AI Assist',
  });
  assert.deepEqual(standardSelections.AI_INTELLIGENCE_MODULE, {
    included: false,
    selectedTier: 'AI Decisioning',
  });
  assert.deepEqual(advancedSelections.AI_INTELLIGENCE_MODULE, {
    included: false,
    selectedTier: 'AI Intelligence Suite',
  });
});

test('validateQuoteDraft catches unsupported currency and empty scope', () => {
  const draft = createEmptyQuoteDraft();

  draft.customerName = 'Horizon Mills';
  draft.projectName = 'Invalid scope';
  draft.createdBy = 'user-ian-implementation';
  draft.currency = 'EUR';
  draft.moduleSelections = buildModuleSelectionsFromTemplate('custom-package');
  draft.moduleSelections.SHARED_PLATFORM_CORE.included = false;

  const validation = validateQuoteDraft(draft);

  assert.deepEqual(validation.errors, [
    'Currency must be one of the supported currencies.',
    'Select at least one module before submitting the quote.',
  ]);
});
