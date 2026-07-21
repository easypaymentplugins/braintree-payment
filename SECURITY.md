# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.0.x | ✅ |

## Reporting a vulnerability

This plugin handles payment flows, so we take security reports seriously.

Please **do not** open a public GitHub issue for security vulnerabilities. Instead, report them privately via [GitHub Security Advisories](https://github.com/easypaymentplugins/braintree-payment/security/advisories/new) for this repository.

Include:

- A description of the vulnerability and its impact
- Steps to reproduce or a proof of concept
- Affected versions

We will acknowledge reports promptly, work on a fix, and credit reporters in the release notes unless they prefer otherwise.

## Handling of secrets

- Braintree credentials (`merchantId`, `publicKey`, `privateKey`, `webhookSecret`) are only ever read from provider options; they are never logged, persisted, or transmitted anywhere except to the official Braintree SDK.
- Webhook payloads are signature-verified through the Braintree SDK before any payment state is changed.
- Debug logging (`logging: true`) logs operation metadata (transaction ids, statuses, amounts) but never credentials or raw card data. Card data itself never touches your server — Braintree's client SDK tokenizes it into a nonce in the browser.
