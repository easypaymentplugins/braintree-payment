# Changelog

## 0.0.5

### Fixed

- All repository links (`repository`, `homepage`, `bugs`, and `author` in `package.json`, plus README, CONTRIBUTING, SECURITY, and the docs guides) now point to the correct GitHub organization — `github.com/easypaymentplugins/braintree-payment`. Previously they pointed to a non-existent `easypayment` organization, so the "Repository" and "Issues" links on the npm package page were broken.

### Changed

- README refreshed with a centered header, an expanded badge row (npm version, downloads, CI status, license, Node, Medusa, TypeScript), quick navigation links, and new Contributing and Security sections.
- Additional npm keywords (`braintree`, `paypal`, `payment`, `ach`, `direct-debit`, `credit-card`, `3d-secure`, `ecommerce`) for better discoverability.
- LICENSE copyright notice now names EasyPayment as the copyright holder.

## 0.0.4

### Changed

- Added npm keywords (`medusa-v2`, `medusa-plugin-integration`, `medusa-plugin-payment`) so the plugin is discoverable in the Medusa plugin ecosystem, matching `@easypayment/medusa-payment-paypal`.

## 0.0.3

### Changed

- Updated the LICENSE notice.

## 0.0.2

### Changed

- Refreshed README and documentation; the npm package page now reflects the current docs (the README license section links to the LICENSE file for the full notice).

## 0.0.1

Initial release of `@easypayment/medusa-payment-braintree` under the EasyPayment brand.

### Changed

- Package moved to the `@easypayment` scope — the package is now `@easypayment/medusa-payment-braintree`, and all repository links point to the `easypayment` GitHub organization.
- Every Braintree transaction sale request now includes the partner BN code (`MBJTechnolabs_SI_SPB`) as the transaction `channel` for PayPal partner attribution.

### Added

- Complete step-by-step setup guide (`docs/USER-GUIDE.md`) covering the full journey — Braintree sandbox signup, credentials, installation, configuration, admin setup, custom fields, webhooks, storefront integration, sandbox testing, ACH, 3D Secure, imported payments, a going-live checklist, and troubleshooting — written in plain language for non-technical users as well as developers.
- Storefront integration guide (`docs/STOREFRONT-GUIDE.md`) — full step-by-step frontend walkthrough: how checkout payments work in Medusa v2, listing/displaying the Card and ACH payment methods at checkout, payment sessions and client tokens, card payments with Braintree Drop-in, the nonce → order completion flow, ACH bank form with the required debit-authorization mandate, 3D Secure, exact wiring for the official Next.js starter, a testing checklist, and troubleshooting.

### Fixed

- Webhook handling no longer fails on transactions that have no custom fields configured in Braintree (`customFields` is now safely defaulted before reading `medusa_payment_session_id`).
- `npm publish` can no longer ship an empty package when the plugin build fails: a publish gate (`scripts/verify-publish.js`) now verifies the compiled `.medusa/server` output exists and aborts the publish otherwise, and the build scripts use the project-local Medusa CLI instead of `npx` (which could silently fall back to a broken globally-installed CLI).
- `publishConfig.access` is set to `public` so publishing the scoped package no longer fails with npm's 402 "you must sign up for private packages" error (scoped packages default to private/restricted access).

### Features

- Braintree (a PayPal service) payment provider for Medusa v2.
- Two customer-facing payment methods: **Credit / Debit Card** (`braintree`) and **ACH Direct Debit** (`braintree-ach`), registered as separate Medusa payment providers.
- ACH support includes configurable bank-account verification (`achVerificationMethod`, default `network_check`), optional dedicated merchant account routing (`achMerchantAccountId`), and enforced immediate settlement per Braintree's ACH rules.
- Secure payment processing with authorize, capture, refund, void, and cancel flows.
- 3D Secure authentication support (`enable3DSecure`).
- Webhook handling for payment status updates with signature validation.
- Save payment methods (vaulting) for future transactions (`savePaymentMethod`).
- Auto-capture support (`autoCapture`).
- Imported-transaction provider with graceful handling of already-refunded transactions (`allowRefundOnRefunded`).
- Custom fields forwarded to Braintree transactions (`context.custom_fields`).
- Sandbox refund testing via `TEST_FORCE_SETTLED` (sandbox-only, with warning outside sandbox).
- Optional debug logging via the `logging` option / `BRAINTREE_LOGGING` env var.
