# Contributing to EasyPayment Braintree for Medusa

Thanks for your interest in improving this plugin!

## Getting started

```bash
git clone https://github.com/easypayment/braintree-payment.git
cd braintree-payment
npm install
```

## Development workflow

- `npm run typecheck` — strict TypeScript check, must pass with no errors.
- `npm test` — Jest test suite, must pass.
- `npm run build` — builds the plugin with the Medusa CLI into `.medusa/server`.
- `npm run plugin:dev` — run the plugin in watch mode against a local Medusa app.

## Pull requests

1. Create a feature branch from `main`.
2. Keep changes focused; one concern per PR.
3. Add or update tests for any behavior change — payment code is only trusted when it is tested.
4. Make sure `npm run typecheck`, `npm test`, and `npm run build` all pass locally.
5. Update `README.md` and `CHANGELOG.md` when behavior or options change.

## Reporting bugs

Open a [GitHub issue](https://github.com/easypayment/braintree-payment/issues) with:

- Plugin, Medusa, and Node versions
- The Braintree environment (sandbox/production)
- Steps to reproduce and the relevant log output (with credentials redacted)

**Never include Braintree private keys, webhook secrets, or customer data in issues or PRs.**

## Security issues

Please do not report security vulnerabilities through public issues — see [SECURITY.md](SECURITY.md).
