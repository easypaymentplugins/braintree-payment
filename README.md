<div align="center">

# Braintree Payments for Medusa v2

**Accept Credit / Debit Cards and ACH Direct Debit in your Medusa store<br>with the full Braintree payment lifecycle — by EasyPayment.**

[![npm version](https://img.shields.io/npm/v/%40easypayment%2Fmedusa-payment-braintree.svg?logo=npm&color=cb3837)](https://www.npmjs.com/package/@easypayment/medusa-payment-braintree)
[![npm downloads](https://img.shields.io/npm/dm/%40easypayment%2Fmedusa-payment-braintree.svg?color=blue)](https://www.npmjs.com/package/@easypayment/medusa-payment-braintree)
[![CI](https://github.com/easypaymentplugins/braintree-payment/actions/workflows/ci.yml/badge.svg)](https://github.com/easypaymentplugins/braintree-payment/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node >= 20](https://img.shields.io/badge/Node-%E2%89%A5%2020-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Medusa v2](https://img.shields.io/badge/Medusa-v2-purple)](https://medusajs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)

[Installation](#installation) · [Configuration](#configuration) · [Provider Options](#provider-options) · [Setup Guide](docs/USER-GUIDE.md) · [Storefront Guide](docs/STOREFRONT-GUIDE.md) · [Changelog](CHANGELOG.md)

</div>

---

**`@easypayment/medusa-payment-braintree`** is a production-grade [Braintree](https://www.braintreepayments.com/) (a PayPal service) payment provider for [Medusa v2](https://medusajs.com). It gives your Medusa store two customer-facing payment methods — **Credit / Debit Card** and **ACH Direct Debit** — with the full Braintree payment lifecycle: client-token generation, authorization, capture, refunds, voids, vaulted payment methods, 3D Secure, and webhook-driven status updates, all behind Medusa's standard payment provider interface.

Built and maintained by **EasyPayment**.

> **New to Medusa or not a developer?** Follow the **[Complete Setup Guide](docs/USER-GUIDE.md)** — a plain-language, step-by-step walkthrough from creating a Braintree account to your first live payment, written for store owners as well as developers.
>
> **Building the checkout?** The **[Storefront Integration Guide](docs/STOREFRONT-GUIDE.md)** shows step by step how to display the Card and ACH payment methods in your checkout's payment list and wire up the full payment flow (Drop-in, ACH, 3D Secure, Next.js starter).

## Table of Contents

- [Highlights](#highlights)
- [Payment Methods](#payment-methods)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Provider Options](#provider-options)
- [ACH Direct Debit](#ach-direct-debit)
- [3D Secure](#3d-secure)
- [Webhooks](#webhooks)
- [Custom Fields](#custom-fields)
- [Imported Payments Provider](#imported-payments-provider)
- [Sandbox & Testing](#sandbox--testing)
- [Debug Logging](#debug-logging)
- [Support](#support)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Highlights

- **Two payment methods** — Credit / Debit Card and ACH Direct Debit (US bank accounts), each exposed as its own Medusa payment provider so your checkout can offer them side by side.
- **Full payment lifecycle** — initiate, authorize, capture (manual or automatic), refund, void, and cancel, mapped cleanly onto Braintree transaction states.
- **3D Secure** — opt-in strong customer authentication via a single config flag.
- **Vaulting** — save customer payment methods in the Braintree Vault for one-click repeat purchases.
- **Webhook validation** — Braintree webhook signatures are verified before any payment state changes are applied.
- **Client-token caching** — client tokens are cached per customer through Medusa's cache module, cutting redundant gateway calls.
- **Imported payments** — a second provider (`imported`) for orders migrated from another platform, with safe refund/void handling against the original Braintree transactions.
- **Actionable errors** — processor declines, gateway rejections, and validation errors surface with their Braintree codes instead of generic failures.
- **Typed end to end** — written in strict TypeScript against the official Braintree SDK and Medusa v2 provider interfaces, with a Jest test suite covering the payment flows.

## Payment Methods

The plugin registers three Medusa payment provider services from one module:

| Provider id | Payment method | Notes |
|---|---|---|
| `braintree` | Credit / Debit Card | Cards tokenized by the Braintree client SDK; supports 3D Secure and vaulting. |
| `braintree-ach` | ACH Direct Debit | US bank accounts tokenized by the Braintree client SDK; bank-account verification and (optionally) a dedicated ACH merchant account. |
| `imported` | Imported payments | For orders migrated from another platform — see [Imported Payments Provider](#imported-payments-provider). |

Enable each method per region in the Medusa admin like any other payment provider, and your storefront presents "Credit Card" and "ACH / Bank Debit" as separate options at checkout.

## Requirements

- Node.js `>= 20`
- Medusa `v2.15+`
- A Braintree account ([sandbox](https://sandbox.braintreegateway.com/) or production) with API credentials

## Installation

```bash
npm install @easypayment/medusa-payment-braintree
# or
yarn add @easypayment/medusa-payment-braintree
```

## Configuration

### 1. Environment variables

Add your Braintree credentials to `.env`:

```env
BRAINTREE_MERCHANT_ID=<your_merchant_id>
BRAINTREE_PUBLIC_KEY=<your_public_key>
BRAINTREE_PRIVATE_KEY=<your_private_key>
BRAINTREE_WEBHOOK_SECRET=<your_webhook_secret>
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_ENABLE_3D_SECURE=false
BRAINTREE_LOGGING=false
```

### 2. Register the provider

Add the provider to the `payment` module in `medusa-config.ts`:

```ts
import { Modules } from '@medusajs/framework/utils';

// ...
{
  resolve: '@medusajs/medusa/payment',
  dependencies: [Modules.CACHE],
  options: {
    providers: [
      {
        resolve: '@easypayment/medusa-payment-braintree/providers/easypayment-braintree',
        id: 'braintree',
        options: {
          environment: process.env.BRAINTREE_ENVIRONMENT ?? 'sandbox',
          merchantId: process.env.BRAINTREE_MERCHANT_ID,
          publicKey: process.env.BRAINTREE_PUBLIC_KEY,
          privateKey: process.env.BRAINTREE_PRIVATE_KEY,
          webhookSecret: process.env.BRAINTREE_WEBHOOK_SECRET,
          defaultCurrencyCode: 'USD',
          enable3DSecure: process.env.BRAINTREE_ENABLE_3D_SECURE === 'true',
          savePaymentMethod: true,
          autoCapture: true,
          allowRefundOnRefunded: false,
          // ACH Direct Debit
          achMerchantAccountId: process.env.BRAINTREE_ACH_MERCHANT_ACCOUNT_ID,
          achVerificationMethod: 'network_check',
          logging: process.env.BRAINTREE_LOGGING === 'true',
        },
      },
    ],
  },
}
```

This single entry registers all three provider services (`braintree`, `braintree-ach`, and `imported`) — they share the same options.

### 3. Restart your Medusa server

The providers register themselves with Medusa's payment module on boot. Enable **Credit Card** (`braintree`) and **ACH Direct Debit** (`braintree-ach`) for your regions in the Medusa admin.

## Provider Options

| Option | Type | Default | Description |
|---|---|---|---|
| `environment` | `'sandbox' \| 'production' \| 'development' \| 'qa'` | — (required) | Braintree gateway environment. |
| `merchantId` | `string` | — (required) | Braintree merchant ID. |
| `publicKey` | `string` | — (required) | Braintree public key. |
| `privateKey` | `string` | — (required) | Braintree private key. |
| `webhookSecret` | `string` | — (required) | Secret used when validating incoming Braintree webhooks. |
| `defaultCurrencyCode` | `string` | `undefined` | Optional default currency code. |
| `enable3DSecure` | `boolean` | `false` | Require 3D Secure verification on transactions. |
| `savePaymentMethod` | `boolean` | `false` | Store payment methods in the Braintree Vault on success. |
| `autoCapture` | `boolean` | `false` | Submit transactions for settlement immediately after authorization. ACH transactions are always submitted for settlement regardless of this flag (a Braintree requirement). |
| `achMerchantAccountId` | `string` | `undefined` | Merchant account to route ACH transactions and bank-account verifications through. Set this when your default merchant account does not support ACH. |
| `achVerificationMethod` | `'network_check' \| 'independent_check' \| 'micro_transfers' \| 'tokenized_check'` | `'network_check'` | How Braintree verifies US bank accounts for ACH. |
| `allowRefundOnRefunded` | `boolean` | `false` | Imported provider only: record refunds locally (with a warning) when the Braintree transaction was already refunded upstream. |
| `logging` | `boolean` | `false` | Verbose debug logging through Medusa's logger. Keep off in production unless actively debugging. |

## ACH Direct Debit

The `braintree-ach` provider accepts US bank account payments through Braintree's ACH Direct Debit rails:

- **Client side** — tokenize the customer's bank account details (routing/account number or bank login) with the Braintree client SDK's US bank account component to obtain a nonce, exactly as you would for a card. See the [Braintree ACH guide](https://developer.paypal.com/braintree/docs/guides/ach/overview/).
- **Verification** — the provider sends `usBankAccountVerificationMethod` (default `network_check`, configurable via `achVerificationMethod`) with every sale and vaulting request, so bank accounts are verified as part of the transaction.
- **Settlement** — Braintree requires ACH transactions to be submitted for settlement immediately; the provider enforces this regardless of `autoCapture`. Note that ACH settlement is not instant — funds typically clear in a few business days, and the `transaction_settled` / `transaction_settlement_declined` webhooks are how your store learns the outcome, so configure [webhooks](#webhooks).
- **Merchant account** — ACH must be enabled on your Braintree account. If it runs through a dedicated merchant account, set `achMerchantAccountId`.
- **3D Secure** — does not apply to bank accounts; the ACH provider never requests it, even when `enable3DSecure` is on.

## 3D Secure

Set `enable3DSecure: true` to require 3D Secure on every transaction. Your storefront must complete the 3DS challenge flow when requesting the payment method nonce — see the [Braintree 3D Secure guide](https://developer.paypal.com/braintree/docs/guides/3d-secure/overview/) for the client-side setup.

## Webhooks

Braintree notifies your store when transactions settle or are declined at settlement:

1. In the Braintree control panel, go to **Settings → Webhooks**.
2. Add a webhook pointing at your Medusa server's payment webhook endpoint, e.g. `https://your-store.com/hooks/payment/braintree_braintree`.
3. Incoming notifications are parsed and signature-verified with your gateway credentials; invalid payloads are rejected.

Handled notification kinds:

| Braintree notification | Medusa action |
|---|---|
| `transaction_settled` | Payment marked successful |
| `transaction_settlement_declined` | Payment marked failed |
| anything else | Ignored (`NOT_SUPPORTED`) |

Webhook correlation relies on the `medusa_payment_session_id` custom field — see below.

## Custom Fields

The provider forwards `context.custom_fields` to Braintree's `customFields` on the sale request. Fields must first be created in the Braintree control panel (**Account Settings → Transactions → Custom Fields**, option "Store and Pass back"; API names must be lowercase).

Recommended fields:

| Field name | API name | Purpose |
|---|---|---|
| Medusa Payment Session Id | `medusa_payment_session_id` | Webhook correlation back to the Medusa payment session |
| Cart Id | `cart_id` | Traceability |
| Customer Id | `customer_id` | Traceability |

Example authorize call shape:

```ts
await provider.authorizePayment({
  data: {
    amount: 10, // standard currency units — converted to "10.00"
    currency_code: 'USD',
    payment_method_nonce: '<client-side-nonce>',
  },
  context: {
    idempotency_key: 'sess_123',
    customer: { id: 'cust_123', email: 'customer@example.com' },
    custom_fields: {
      medusa_payment_session_id: 'sess_123',
      cart_id: 'cart_123',
      customer_id: 'cust_123',
    },
  },
});
```

Only fields that exist in your Braintree dashboard are accepted, and values must be strings.

## Imported Payments Provider

Alongside the main provider, the plugin ships an `imported` provider for orders migrated from another platform whose payments already live in Braintree. It lets migrated orders participate in Medusa's payment flows without re-charging anyone:

- Sessions are keyed by the original Braintree `transactionId`.
- Refunds and cancellations are executed against the real Braintree transaction — voided while `authorized`/`submitted_for_settlement`, refunded once `settled`/`settling`.
- Orders imported as already refunded (`importedAsRefunded: true`) record refunds locally without touching Braintree.
- With `allowRefundOnRefunded: true`, refunding a transaction that was already refunded upstream logs a warning and records the refund locally instead of failing the operation.

Register it with the same options under the id `imported` if you need it.

## Sandbox & Testing

In the Braintree sandbox, transactions tend to sit in `authorized` or `submitted_for_settlement`, which exercises the **void** path on refund. To exercise the true **refund** path (settled transactions) without waiting for settlement:

```env
BRAINTREE_ENVIRONMENT=sandbox
TEST_FORCE_SETTLED=true
```

With both set, the provider settles the transaction through Braintree's sandbox testing API before refunding. This switch is sandbox-only — outside the sandbox environment it is ignored and a warning is logged. Never enable it in production.

Run the plugin's own test suite from a checkout of this repository:

```bash
npm install
npm run typecheck
npm test
```

## Debug Logging

Set `logging: true` (or `BRAINTREE_LOGGING=true` with the config shown above) to log operation context for every payment flow — initiate, authorize, capture, refund, void, webhooks — plus expanded Braintree failure details (validation errors, processor response codes) through Medusa's logger with an `[EasyPayment Braintree]` prefix. Logs are emitted at `info` level, so make sure Medusa's `LOG_LEVEL` includes `info` to see them.

## Support

- Step-by-step setup help (non-technical friendly): [Complete Setup Guide](docs/USER-GUIDE.md)
- Checkout/frontend integration: [Storefront Integration Guide](docs/STOREFRONT-GUIDE.md)
- Bug reports and feature requests: [GitHub Issues](https://github.com/easypaymentplugins/braintree-payment/issues)
- Braintree platform documentation: [developer.paypal.com/braintree](https://developer.paypal.com/braintree/docs)

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for the development workflow and pull-request checklist. In short: keep changes focused, add tests for behavior changes, and make sure `npm run typecheck`, `npm test`, and `npm run build` all pass.

## Security

This plugin handles payment flows, so security reports are taken seriously. Please **do not** open public issues for vulnerabilities — report them privately as described in the [Security Policy](SECURITY.md). Card data never touches your server: Braintree's client SDK tokenizes it in the browser, and webhook payloads are signature-verified before any payment state changes.

## License

[MIT](LICENSE) © EasyPayment — see [LICENSE](LICENSE) for the full notice.
