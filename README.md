# Dynamic Quoting System

Single-page application for configuring implementation quotations for a B2B2C hire-purchase platform. The app is client-side only and supports drafting and submitting quotations within the browser.

## Features

- Quote builder with module include/exclude controls and tier selection
- Simple three-step flow: configuration, quotation details, and review
- Preset package templates: Starter, Growth, Enterprise, and Custom
- Optional AI Intelligence Module with `AI Assist`, `AI Decisioning`, and `AI Intelligence Suite` tiers
- Real-time single-value quotation calculation using the starting price for each selected tier
- Client-facing quotation document with assumptions, validity, payment terms, and submission-ready summary
- Quote detail view with submission and status management actions
- Quote workflow statuses: `draft`, `submitted`, `approved`, `archived`
- Validation for missing required fields, unsupported currency, and empty module scope
- Config-driven catalog and templates to make future module additions straightforward

## Stack

- Webpack 5
- Vanilla JavaScript
- CSS
- Node built-in test runner for automated tests

## Project Structure

- `src/data/` static pricing catalog, templates, users, and seeded quotes
- `src/domain/` pricing and quote rules
- `src/services/` local storage repository for generated quotations
- `src/ui/` SPA rendering and interaction logic
- `tests/` pricing and quote repository tests

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Open [http://localhost:8080](http://localhost:8080) if it does not open automatically.

4. To enable Blob submission, set `BLOB_READ_WRITE_TOKEN` in your environment before starting or building the app.

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

## Pricing Logic

The pricing rules live in `src/domain/quoteEngine.js`.

Calculation order:

1. `subtotal = sum(selected module starting tier costs)`
2. `discount amount = subtotal x discount%`
3. `discounted subtotal = subtotal - discount amount`
4. `tax amount = discounted subtotal x tax%`
5. `final total = discounted subtotal + tax amount`

All financial outputs are rounded to 2 decimal places.

## Business Defaults

- Platform Core is included by default in the Custom template and all non-trivial preset packages.
- Mobile Money Integration is modeled as an optional add-on.
- AI Intelligence Module is modeled as an optional add-on.
- Basic/Starter templates keep AI off by default; Standard/Growth preselect `AI Decisioning`, and Advanced/Enterprise preselect `AI Intelligence Suite` as optional recommended tiers.
- Currency support currently starts with ZMK.
- The app ships with seeded sample quotes for local development and UI verification.

## Persistence Model

- Quotes are stored under browser local storage.
- There is no server persistence in this implementation.

## Future Extension

The code separates catalog data, pricing rules, storage, and UI so a future cash-loan quoting flow can be added as a separate quote domain without rewriting the current SPA.
