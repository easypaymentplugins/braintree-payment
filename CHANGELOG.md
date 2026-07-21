# Changelog

## Unreleased

### Added

- Complete step-by-step setup guide (`docs/USER-GUIDE.md`) covering the full journey — Braintree sandbox signup, credentials, installation, configuration, admin setup, custom fields, webhooks, storefront integration, sandbox testing, ACH, 3D Secure, imported payments, a going-live checklist, and troubleshooting — written in plain language for non-technical users as well as developers.

### Fixed

- Webhook handling no longer fails on transactions that have no custom fields configured in Braintree (`customFields` is now safely defaulted before reading `medusa_payment_session_id`).

## 0.0.1

Initial release of `@easypaymentplugins/medusa-payment-braintree` under the EasyPayment brand.

Based on the MIT-licensed `@lambdacurry/medusa-payment-braintree` (v0.1.5) by Lambda Curry.

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
