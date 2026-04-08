const MODULE_CATALOG = [
  {
    id: 'module-shared-platform-core',
    code: 'SHARED_PLATFORM_CORE',
    name: 'Platform Core',
    description: 'The foundation that powers the whole solution. It handles secure access, user roles, core system setup, notifications, and the shared services every module depends on.',
    isOptional: false,
    isActive: true,
    tiers: [
      {
        id: 'tier-shared-platform-core-basic',
        tierName: 'Starter',
        lowCost: 12000,
        highCost: 18000,
        description: 'Secure login, user access control, core system setup, email notifications, basic activity tracking',
      },
      {
        id: 'tier-shared-platform-core-standard',
        tierName: 'Growth',
        lowCost: 18000,
        highCost: 28000,
        description: 'Everything in Starter, plus stronger permissions, document storage, SMS/email notifications, workflow support, reporting foundation',
      },
      {
        id: 'tier-shared-platform-core-advanced',
        tierName: 'Enterprise',
        lowCost: 28000,
        highCost: 40000,
        description: 'Everything in Growth, plus advanced audit trail, configurable workflows, stronger security controls, scalability readiness, monitoring support',
      },
    ],
  },
  {
    id: 'module-admin',
    code: 'ADMIN',
    name: 'Admin Portal',
    description: 'The central control center for your internal team to manage employers, employees, distributors, products, approvals, and reporting.',
    isOptional: false,
    isActive: true,
    tiers: [
      {
        id: 'tier-admin-basic',
        tierName: 'Starter',
        lowCost: 15000,
        highCost: 22000,
        description: 'Manage users, employers, distributors, products, and applications; view basic reports',
      },
      {
        id: 'tier-admin-standard',
        tierName: 'Growth',
        lowCost: 22000,
        highCost: 32000,
        description: 'Everything in Starter, plus pricing setup, installment rules, contract tracking, repayment tracking, dashboards, exception handling',
      },
      {
        id: 'tier-admin-advanced',
        tierName: 'Enterprise',
        lowCost: 32000,
        highCost: 45000,
        description: 'Everything in Growth, plus advanced approvals, arrears monitoring, admin overrides, deeper analytics, detailed reporting',
      },
    ],
  },
  {
    id: 'module-employer',
    code: 'EMPLOYER',
    name: 'Employer Portal',
    description: 'A dedicated space for partner companies to manage employee access, verify staff, and view participation and repayment activity.',
    isOptional: false,
    isActive: true,
    tiers: [
      {
        id: 'tier-employer-basic',
        tierName: 'Starter',
        lowCost: 6000,
        highCost: 10000,
        description: 'Employer login, employee verification, employee list view, basic reporting',
      },
      {
        id: 'tier-employer-standard',
        tierName: 'Growth',
        lowCost: 10000,
        highCost: 16000,
        description: 'Everything in Starter, plus eligibility uploads, application visibility, approval/recommendation workflows, repayment visibility, better reports',
      },
      {
        id: 'tier-employer-advanced',
        tierName: 'Enterprise',
        lowCost: 16000,
        highCost: 24000,
        description: 'Everything in Growth, plus employer-specific rules, payroll deduction file support, agreement visibility, branch-level access, detailed reporting',
      },
    ],
  },
  {
    id: 'module-employee',
    code: 'EMPLOYEE',
    name: 'Employee Portal',
    description: 'The self-service experience employees use to browse gadgets, apply, upload documents, and track their application and repayment information.',
    isOptional: false,
    isActive: true,
    tiers: [
      {
        id: 'tier-employee-basic',
        tierName: 'Starter',
        lowCost: 10000,
        highCost: 15000,
        description: 'Sign up/login, profile setup, browse gadgets, submit application, track application status',
      },
      {
        id: 'tier-employee-standard',
        tierName: 'Growth',
        lowCost: 15000,
        highCost: 22000,
        description: 'Everything in Starter, plus installment calculator, document upload, digital acceptance of terms, notifications, repayment schedule view',
      },
      {
        id: 'tier-employee-advanced',
        tierName: 'Enterprise',
        lowCost: 22000,
        highCost: 30000,
        description: 'Everything in Growth, plus enhanced experience, automated eligibility checks, richer dashboard, contract history, support request tools, better status tracking',
      },
    ],
  },
  {
    id: 'module-distributor',
    code: 'DISTRIBUTOR',
    name: 'Distributor Portal',
    description: 'A workspace for distributors or suppliers to manage products, update stock, fulfill approved orders, and track delivery progress.',
    isOptional: true,
    isActive: true,
    tiers: [
      {
        id: 'tier-distributor-basic',
        tierName: 'Starter',
        lowCost: 7000,
        highCost: 11000,
        description: 'Distributor login, view orders, update order status, basic product listing',
      },
      {
        id: 'tier-distributor-standard',
        tierName: 'Growth',
        lowCost: 11000,
        highCost: 18000,
        description: 'Everything in Starter, plus stock management, order processing, delivery updates, serial/IMEI capture, operational reports',
      },
      {
        id: 'tier-distributor-advanced',
        tierName: 'Enterprise',
        lowCost: 18000,
        highCost: 26000,
        description: 'Everything in Growth, plus branch inventory, stock reservation, returns/exchanges, partial fulfillment, distributor performance insights',
      },
    ],
  },
  {
    id: 'module-mobile-money-integration',
    code: 'MOBILE_MONEY_INTEGRATION',
    name: 'Mobile Money Integration',
    description: 'Enables customers and teams to connect the platform with mobile money services for repayments and transaction tracking.',
    isOptional: true,
    isActive: true,
    tiers: [
      {
        id: 'tier-mobile-money-basic',
        tierName: 'Starter',
        lowCost: 5000,
        highCost: 10000,
        description: 'One provider connection, payment initiation, transaction callback handling, payment records',
      },
      {
        id: 'tier-mobile-money-standard',
        tierName: 'Growth',
        lowCost: 10000,
        highCost: 20000,
        description: 'Everything in Starter, plus multiple providers, repayment workflows, reconciliation view, failed transaction handling, payment history',
      },
      {
        id: 'tier-mobile-money-advanced',
        tierName: 'Enterprise',
        lowCost: 20000,
        highCost: 35000,
        description: 'Everything in Growth, plus routing, retry logic, refunds/reversals, settlement tracking, payout support, advanced reconciliation and reporting',
      },
    ],
  },
  {
    id: 'module-ai-intelligence',
    code: 'AI_INTELLIGENCE_MODULE',
    name: 'AI Intelligence Module',
    description: 'Adds intelligent automation, decision support, and predictive insights across the platform to improve user experience, reduce manual work, and strengthen operational control.',
    isOptional: true,
    isActive: true,
    tiers: [
      {
        id: 'tier-ai-intelligence-assist',
        tierName: 'AI Assist',
        lowCost: 8000,
        highCost: 15000,
        description: 'Employee FAQ chatbot, guided application support, basic document completeness checks, guided support responses',
      },
      {
        id: 'tier-ai-intelligence-decisioning',
        tierName: 'AI Decisioning',
        lowCost: 15000,
        highCost: 28000,
        description: 'Everything in AI Assist, plus smart eligibility guidance, document quality validation, admin approval support, anomaly alerts, smarter repayment reminder optimization',
      },
      {
        id: 'tier-ai-intelligence-suite',
        tierName: 'AI Intelligence Suite',
        lowCost: 28000,
        highCost: 50000,
        description: 'Everything in AI Decisioning, plus fraud pattern detection, collections prioritization, distributor demand forecasting, portfolio insights, natural-language reporting',
      },
    ],
  },
];

const QUOTE_TEMPLATES = [
  {
    id: 'basic-package',
    name: 'Starter Package',
    description: 'Core launch scope for a lean employer and employee rollout, with AI kept off by default.',
    defaultModuleTierMap: {
      SHARED_PLATFORM_CORE: { included: true, tier: 'Starter' },
      ADMIN: { included: true, tier: 'Starter' },
      EMPLOYER: { included: true, tier: 'Starter' },
      EMPLOYEE: { included: true, tier: 'Starter' },
      DISTRIBUTOR: { included: false, tier: 'Starter' },
      MOBILE_MONEY_INTEGRATION: { included: false, tier: 'Starter' },
      AI_INTELLIGENCE_MODULE: { included: false, tier: 'AI Assist' },
    },
  },
  {
    id: 'standard-package',
    name: 'Growth Package',
    description: 'Balanced implementation scope for rollout, operations, and fulfillment, with AI Decisioning recommended as an optional add-on.',
    defaultModuleTierMap: {
      SHARED_PLATFORM_CORE: { included: true, tier: 'Growth' },
      ADMIN: { included: true, tier: 'Growth' },
      EMPLOYER: { included: true, tier: 'Growth' },
      EMPLOYEE: { included: true, tier: 'Growth' },
      DISTRIBUTOR: { included: true, tier: 'Growth' },
      MOBILE_MONEY_INTEGRATION: { included: false, tier: 'Starter' },
      AI_INTELLIGENCE_MODULE: { included: false, tier: 'AI Decisioning' },
    },
  },
  {
    id: 'advanced-package',
    name: 'Enterprise Package',
    description: 'Full rollout with richer operations, distribution, and payments integration, with the AI Intelligence Suite recommended as an optional add-on.',
    defaultModuleTierMap: {
      SHARED_PLATFORM_CORE: { included: true, tier: 'Enterprise' },
      ADMIN: { included: true, tier: 'Enterprise' },
      EMPLOYER: { included: true, tier: 'Enterprise' },
      EMPLOYEE: { included: true, tier: 'Enterprise' },
      DISTRIBUTOR: { included: true, tier: 'Enterprise' },
      MOBILE_MONEY_INTEGRATION: { included: true, tier: 'Enterprise' },
      AI_INTELLIGENCE_MODULE: { included: false, tier: 'AI Intelligence Suite' },
    },
  },
  {
    id: 'custom-package',
    name: 'Custom Package',
    description: 'Editable starting point with the shared platform core included by default.',
    defaultModuleTierMap: {
      SHARED_PLATFORM_CORE: { included: true, tier: 'Starter' },
      ADMIN: { included: false, tier: 'Starter' },
      EMPLOYER: { included: false, tier: 'Starter' },
      EMPLOYEE: { included: false, tier: 'Starter' },
      DISTRIBUTOR: { included: false, tier: 'Starter' },
      MOBILE_MONEY_INTEGRATION: { included: false, tier: 'Starter' },
      AI_INTELLIGENCE_MODULE: { included: false, tier: 'AI Assist' },
    },
  },
];

const USER_OPTIONS = [
  { id: 'user-sara-sales', name: 'Sara Sales', role: 'sales' },
  { id: 'user-ian-implementation', name: 'Ian Implementation', role: 'implementation' },
  { id: 'user-amara-admin', name: 'Amara Admin', role: 'admin' },
];

const CLIENT_QUOTATION_DEFAULTS = {
  acceptanceNote: 'Please confirm acceptance of this quotation by signing the implementation agreement or issuing a written purchase confirmation.',
  paymentTerms: 'Payment terms will be confirmed in the final commercial agreement.',
  validityDays: 30,
};

const SUPPORTED_CURRENCIES = ['ZMK'];
const QUOTE_STATUSES = ['draft', 'generated', 'approved', 'archived'];
const DEFAULT_TEMPLATE_ID = 'custom-package';

module.exports = {
  CLIENT_QUOTATION_DEFAULTS,
  DEFAULT_TEMPLATE_ID,
  MODULE_CATALOG,
  QUOTE_STATUSES,
  QUOTE_TEMPLATES,
  SUPPORTED_CURRENCIES,
  USER_OPTIONS,
};
