# Storefront Integration Guide — Showing Braintree Card & ACH at Checkout

This guide walks through the **frontend (storefront) side** of the EasyPayment Braintree plugin, step by step: how to make **Credit / Debit Card** and **ACH Direct Debit** appear in your checkout's payment method list, collect the payment details securely, and complete the order.

It pairs with the [Complete Setup Guide](USER-GUIDE.md), which covers the server side (installation, configuration, Braintree account, webhooks). **Finish that first** — this guide assumes the plugin is installed, configured, and enabled for your region in the Medusa Admin.

> **Who this is for:** this is the one genuinely developer-facing part of the setup. If you're a store owner, send this page to your developer — everything they need is here, in order. Sections marked 📖 explain the concepts in plain language so you can follow along too.

## Table of Contents

1. [📖 How Checkout Payments Work in Medusa v2](#1--how-checkout-payments-work-in-medusa-v2)
2. [The Provider IDs You'll Use](#2-the-provider-ids-youll-use)
3. [Step 1 — Install the Client Packages](#3-step-1--install-the-client-packages)
4. [Step 2 — List the Payment Methods at Checkout](#4-step-2--list-the-payment-methods-at-checkout)
5. [Step 3 — Give the Methods Friendly Names and Icons](#5-step-3--give-the-methods-friendly-names-and-icons)
6. [Step 4 — Start a Payment Session and Get the Client Token](#6-step-4--start-a-payment-session-and-get-the-client-token)
7. [Step 5 — Card Payments with Braintree Drop-in](#7-step-5--card-payments-with-braintree-drop-in)
8. [Step 6 — Send the Nonce Back and Place the Order](#8-step-6--send-the-nonce-back-and-place-the-order)
9. [Step 7 — ACH Direct Debit (US Bank Accounts)](#9-step-7--ach-direct-debit-us-bank-accounts)
10. [Step 8 — 3D Secure](#10-step-8--3d-secure)
11. [Putting It Together in the Next.js Starter](#11-putting-it-together-in-the-nextjs-starter)
12. [Testing Your Integration](#12-testing-your-integration)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. 📖 How Checkout Payments Work in Medusa v2

Before code, the mental model. A Medusa v2 checkout does five things, in order:

```
┌────────────────────────────────────────────────────────────────────┐
│ 1. LIST     Storefront asks Medusa: "which payment providers are   │
│             enabled for this region?" → shows them as options.     │
│                                                                    │
│ 2. SELECT   Customer picks one (e.g. "Credit Card"). Storefront    │
│             creates a payment session for that provider.           │
│             → The plugin answers with a client token.              │
│                                                                    │
│ 3. COLLECT  Storefront uses the client token to render Braintree's │
│             secure payment form. Card/bank details go straight     │
│             from the customer's browser to Braintree — never to    │
│             your server. Braintree hands back a one-time token     │
│             called a NONCE.                                        │
│                                                                    │
│ 4. ATTACH   Storefront saves the nonce into the payment session.   │
│                                                                    │
│ 5. COMPLETE Storefront completes the cart. Medusa calls the        │
│             plugin, which charges the nonce through Braintree.     │
│             → Order created. 🎉                                    │
└────────────────────────────────────────────────────────────────────┘
```

Two takeaways:

- **Your server never sees card numbers.** It only ever sees the client token (safe to expose) and the nonce (single-use, useless to a thief after the sale). This is what keeps you in the lightest PCI compliance bracket.
- **The payment method list is not automatic UI.** Medusa's API tells you *which provider IDs are available*; your storefront decides how to *display* them. Steps 2–3 below are exactly that.

---

## 2. The Provider IDs You'll Use

When the plugin is registered (see the [Complete Setup Guide, Step 5](USER-GUIDE.md#7-step-5--register-the-plugin-in-medusa)) with `id: 'braintree'`, Medusa composes these storefront-facing provider IDs:

| Provider ID | Payment method | Show at checkout? |
|---|---|---|
| `pp_braintree_braintree` | Credit / Debit Card | ✅ Yes |
| `pp_braintree-ach_braintree` | ACH Direct Debit (US bank account) | ✅ Yes (US regions) |
| `pp_imported_braintree` | Imported/migrated payments | ❌ No — internal use only, hide it |

These exact strings are what the API returns and what you'll match on in code. (Pattern: `pp_{provider identifier}_{config id}`.)

---

## 3. Step 1 — Install the Client Packages

In your **storefront** project (not the Medusa server), install Braintree's browser SDKs:

```bash
# Card payments — prebuilt, styled payment form (recommended)
npm install braintree-web-drop-in

# ACH payments and/or fully custom card fields — the lower-level SDK
npm install braintree-web

# TypeScript projects: types
npm install -D @types/braintree-web-drop-in @types/braintree-web
```

If you only want card payments, `braintree-web-drop-in` alone is enough.

---

## 4. Step 2 — List the Payment Methods at Checkout

Ask Medusa which providers are enabled for the cart's region, using the store API. With the official [`@medusajs/js-sdk`](https://docs.medusajs.com/resources/js-sdk):

```ts
// storefront: fetch available payment providers for a region
import { sdk } from '../lib/sdk'; // your configured Medusa JS SDK instance

export async function listPaymentMethods(regionId: string) {
  const { payment_providers } = await sdk.client.fetch<{
    payment_providers: { id: string; is_enabled: boolean }[];
  }>('/store/payment-providers', {
    query: { region_id: regionId },
  });

  return payment_providers;
}
```

Typical response once Braintree is enabled for the region:

```json
{
  "payment_providers": [
    { "id": "pp_braintree_braintree", "is_enabled": true },
    { "id": "pp_braintree-ach_braintree", "is_enabled": true },
    { "id": "pp_system_default", "is_enabled": true }
  ]
}
```

> **Not seeing the Braintree entries?** They only appear for regions where you enabled them in Medusa Admin → Settings → Regions ([Complete Setup Guide, Step 6](USER-GUIDE.md#8-step-6--turn-on-braintree-in-the-medusa-admin)). Restart the Medusa server after config changes.

Filter out what you don't want to offer — at minimum, hide the imported provider:

```ts
const HIDDEN_PROVIDERS = ['pp_imported_braintree', 'pp_system_default'];

const visibleMethods = payment_providers.filter(
  (p) => p.is_enabled && !HIDDEN_PROVIDERS.includes(p.id),
);
```

---

## 5. Step 3 — Give the Methods Friendly Names and Icons

The API returns IDs, not display names — the storefront owns presentation. Keep a small map:

```tsx
// payment-methods.tsx — one place that knows how to *display* each provider
import { CreditCard, Landmark } from 'lucide-react'; // or any icon set

export const paymentInfoMap: Record<string, { title: string; icon: React.ReactNode }> = {
  pp_braintree_braintree: {
    title: 'Credit / Debit Card',
    icon: <CreditCard />,
  },
  'pp_braintree-ach_braintree': {
    title: 'Bank Transfer (ACH Direct Debit)',
    icon: <Landmark />,
  },
};

// Helpers you'll use throughout checkout:
export const isBraintreeCard = (id?: string) => id === 'pp_braintree_braintree';
export const isBraintreeAch = (id?: string) => id === 'pp_braintree-ach_braintree';
export const isBraintree = (id?: string) => isBraintreeCard(id) || isBraintreeAch(id);
```

Render the list as radio options:

```tsx
function PaymentMethodList({ methods, selected, onSelect }) {
  return (
    <div role="radiogroup" aria-label="Payment method">
      {methods.map((method) => {
        const info = paymentInfoMap[method.id];
        if (!info) return null; // unknown provider → don't render a broken option
        return (
          <label key={method.id} className="payment-option">
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onSelect(method.id)}
            />
            {info.icon}
            <span>{info.title}</span>
          </label>
        );
      })}
    </div>
  );
}
```

At this point your checkout **displays "Credit / Debit Card" and "Bank Transfer (ACH)" in the payment list**. The remaining steps make selecting them actually work.

---

## 6. Step 4 — Start a Payment Session and Get the Client Token

When the customer selects a method, create a payment session for that provider on the cart. The plugin responds with a **client token** in the session's `data` — that token is what initializes Braintree's browser SDK.

```ts
// When the customer selects a payment method:
import { sdk } from '../lib/sdk';

export async function selectPaymentMethod(cart: HttpTypes.StoreCart, providerId: string) {
  const collection = await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: providerId, // 'pp_braintree_braintree' or 'pp_braintree-ach_braintree'
  });

  // Find the session we just created and read the client token from it
  const session = collection.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id === providerId,
  );

  const clientToken = session?.data?.client_token as string | undefined;
  if (!clientToken) {
    throw new Error('No Braintree client token on the payment session');
  }

  return { session, clientToken };
}
```

Notes:

- The client token is **safe to use in the browser** — that's its purpose. (The Private Key from your `.env` is the one that must never appear in frontend code.)
- For logged-in customers the plugin caches tokens server-side, so re-selecting a method is cheap.
- Re-calling `initiatePaymentSession` for the same provider updates the existing session — you'll use that in Step 6 to attach the nonce.

---

## 7. Step 5 — Card Payments with Braintree Drop-in

Drop-in is Braintree's prebuilt, PCI-compliant card form: you give it a container `<div>` and the client token; it renders the inputs, does validation, and hands you a nonce. Full docs: [Drop-in UI guide](https://developer.paypal.com/braintree/docs/start/drop-in).

```tsx
// BraintreeCardForm.tsx — React example
import { useEffect, useRef, useState } from 'react';
import dropin, { Dropin } from 'braintree-web-drop-in';

export function BraintreeCardForm({
  clientToken,
  onReady,
}: {
  clientToken: string;
  onReady: (getNonce: () => Promise<string>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Dropin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    dropin
      .create({
        authorization: clientToken,
        container: containerRef.current!,
        // vaultManager: true, // lets logged-in customers manage saved cards
      })
      .then((instance) => {
        if (cancelled) {
          instance.teardown();
          return;
        }
        instanceRef.current = instance;
        // Expose "get me the nonce" to the parent (the Place Order button)
        onReady(async () => {
          const { nonce } = await instance.requestPaymentMethod();
          return nonce;
        });
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
      instanceRef.current?.teardown();
      instanceRef.current = null;
    };
  }, [clientToken]);

  if (error) return <p className="error">Payment form failed to load: {error}</p>;
  return <div ref={containerRef} />;
}
```

Render it when the card method is selected:

```tsx
{isBraintreeCard(selectedMethod) && (
  <BraintreeCardForm clientToken={clientToken} onReady={setGetNonce} />
)}
```

> **Saved cards:** if the server option `savePaymentMethod` is on and the customer is logged in, Braintree vaults the card after a successful payment. Initializing Drop-in with a *customer-scoped* client token makes previously vaulted cards appear automatically in the form for one-click reuse.

> **Prefer full design control?** Use [Hosted Fields](https://developer.paypal.com/braintree/docs/guides/hosted-fields/overview) instead of Drop-in — same client token in, same nonce out; only the rendering differs. Everything else in this guide is unchanged.

---

## 8. Step 6 — Send the Nonce Back and Place the Order

The "Place Order" button does three things: get the nonce from the form, attach it to the payment session, complete the cart.

```ts
import { sdk } from '../lib/sdk';

export async function placeOrder(
  cart: HttpTypes.StoreCart,
  providerId: string,
  getNonce: () => Promise<string>,
) {
  // 1. Ask the Braintree form for the one-time nonce
  const nonce = await getNonce();

  // 2. Attach it to the payment session (re-initiating with data updates the session)
  await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: providerId,
    data: {
      payment_method_nonce: nonce,
    },
  });

  // 3. Complete the cart — Medusa now calls the plugin, which charges
  //    the nonce through Braintree (authorize + capture if autoCapture is on)
  const result = await sdk.store.cart.complete(cart.id);

  if (result.type === 'order') {
    return result.order; // success → redirect to the confirmation page
  }
  // result.type === 'cart' → completion failed; show result.error to the customer
  throw new Error(result.error?.message ?? 'Payment was not accepted');
}
```

Important details:

- **Nonces are single-use and short-lived** (minutes). Get the nonce *inside* the Place Order handler, not when the form loads. If completion fails and the customer retries, request a **fresh** nonce — never reuse one.
- **Declines surface here.** If Braintree declines the card, `cart.complete` fails and the error message includes Braintree's reason (e.g. *"Insufficient Funds (2001)"*). Show it near the payment form and let the customer try another card.
- Want richer data in Braintree (order correlation, traceability)? Pass the [custom fields](USER-GUIDE.md#9-step-7--set-up-custom-fields-in-braintree) via the session context — the plugin forwards `custom_fields` to the transaction.

---

## 9. Step 7 — ACH Direct Debit (US Bank Accounts)

ACH uses the same five-step flow — only the "COLLECT" part differs: instead of Drop-in, you use `braintree-web`'s **US Bank Account** component, and (this part is a legal requirement) the customer must explicitly accept a **debit authorization mandate** before you tokenize. Docs: [Braintree ACH client-side guide](https://developer.paypal.com/braintree/docs/guides/ach/client-side).

```tsx
// BraintreeAchForm.tsx — collect bank details + mandate, produce a nonce
import { useEffect, useRef, useState } from 'react';
import * as braintree from 'braintree-web';

// The mandate text is legally required NACHA authorization language.
// Adjust the business name; keep the substance.
const buildMandateText = (businessName: string) =>
  `By clicking "Place Order", I authorize Braintree, a service of PayPal, ` +
  `on behalf of ${businessName}, to verify my bank account information ` +
  `using bank information and consumer reports, and I authorize ` +
  `${businessName} to initiate an ACH/electronic debit to my checking or ` +
  `savings account. I agree that this authorization will remain in effect ` +
  `until I cancel it in writing, and I agree to notify ${businessName} of ` +
  `any changes in my account information at least 15 days prior to the ` +
  `next billing date.`;

export function BraintreeAchForm({
  clientToken,
  businessName,
  onReady,
}: {
  clientToken: string;
  businessName: string;
  onReady: (getNonce: () => Promise<string>) => void;
}) {
  const usBankRef = useRef<braintree.USBankAccount | null>(null);
  const [form, setForm] = useState({
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    ownershipType: 'personal' as 'personal' | 'business',
    firstName: '',
    lastName: '',
    mandateAccepted: false,
  });

  useEffect(() => {
    let cancelled = false;
    braintree.client
      .create({ authorization: clientToken })
      .then((client) => braintree.usBankAccount.create({ client }))
      .then((usBankAccount) => {
        if (cancelled) return;
        usBankRef.current = usBankAccount;
        onReady(async () => {
          if (!form.mandateAccepted) {
            throw new Error('Please accept the debit authorization to continue.');
          }
          const { nonce } = await usBankRef.current!.tokenize({
            bankDetails: {
              routingNumber: form.routingNumber,
              accountNumber: form.accountNumber,
              accountType: form.accountType,
              ownershipType: form.ownershipType,
              firstName: form.firstName,
              lastName: form.lastName,
              billingAddress: {
                /* street, locality (city), region (state), postalCode — collect
                   these in your form or reuse the cart's billing address */
              },
            },
            mandateText: buildMandateText(businessName),
          });
          return nonce;
        });
      })
      .catch((err) => console.error('ACH init failed:', err));

    return () => {
      cancelled = true;
      usBankRef.current?.teardown();
    };
  }, [clientToken]);

  return (
    <div className="ach-form">
      {/* Inputs bound to `form` state: routing number, account number,
          account type, name — plus the mandate checkbox: */}
      <label>
        <input
          type="checkbox"
          checked={form.mandateAccepted}
          onChange={(e) => setForm({ ...form, mandateAccepted: e.target.checked })}
        />
        <span className="mandate-text">{buildMandateText(businessName)}</span>
      </label>
    </div>
  );
}
```

The nonce it produces goes through **exactly the same Step 6** (`payment_method_nonce` → session → `cart.complete`) — the plugin's ACH provider handles the differences server-side (immediate settlement, bank verification, dedicated merchant account).

**Customer-facing copy worth adding for ACH:**

- "Payment takes 3–5 business days to clear. We'll email you when your order is confirmed." — ACH is *pending* at order time; the settlement **webhook** later flips it to paid or failed ([Complete Setup Guide, Step 8](USER-GUIDE.md#10-step-8--set-up-webhooks) — mandatory for ACH).
- The mandate text must be shown **before** tokenization and the customer must actively accept it (the checkbox above). Braintree records the mandate with the payment.

---

## 10. Step 8 — 3D Secure

If the server has `enable3DSecure: true`, the storefront **must** run the 3DS challenge when producing the nonce, or every card payment will be rejected. With Drop-in it's a flag plus the amount:

```ts
// 1. Enable 3DS when creating the Drop-in:
const instance = await dropin.create({
  authorization: clientToken,
  container: containerRef.current!,
  threeDSecure: true,
});

// 2. Pass the amount when requesting the nonce (Place Order handler):
const { nonce } = await instance.requestPaymentMethod({
  threeDSecure: {
    amount: cartTotal.toFixed(2), // e.g. '49.99' — must match the charge
    // Optional but recommended: email + billing address improve frictionless approval
  },
});
```

The customer may see their bank's verification step (code, app approval) between clicking Place Order and the nonce resolving — that's the feature working. ACH is unaffected (3DS doesn't apply to bank accounts, and the plugin never requests it there).

Full reference: [Braintree 3DS client-side guide](https://developer.paypal.com/braintree/docs/guides/3d-secure/client-side).

---

## 11. Putting It Together in the Next.js Starter

Using the official [Medusa Next.js Starter](https://github.com/medusajs/nextjs-starter-medusa)? It already implements the five-step flow for Stripe — you're adding Braintree alongside. File paths below are from the current starter; minor version drift is possible, but the shape holds.

**1. `src/lib/constants.tsx` — register the display names** (the starter's version of Step 3):

```tsx
export const paymentInfoMap: Record<string, { title: string; icon: React.JSX.Element }> = {
  // ...existing entries...
  pp_braintree_braintree: { title: 'Credit / Debit Card', icon: <CreditCard /> },
  'pp_braintree-ach_braintree': { title: 'Bank Transfer (ACH)', icon: <CreditCard /> },
};

export const isBraintreeCard = (id?: string) => id === 'pp_braintree_braintree';
export const isBraintreeAch = (id?: string) => id === 'pp_braintree-ach_braintree';
export const isBraintree = (id?: string) => isBraintreeCard(id) || isBraintreeAch(id);
```

The payment step (`src/modules/checkout/components/payment/index.tsx`) renders its radio list from `paymentInfoMap` via `listCartPaymentMethods` — with the map entries added, **Braintree and ACH now show up in the payment list automatically**.

**2. `src/modules/checkout/components/payment/index.tsx` — mount the Braintree form.** Where the starter conditionally renders its Stripe card container after a method is selected, add the Braintree equivalents:

```tsx
{isBraintreeCard(selectedPaymentMethod) && (
  <BraintreeCardForm clientToken={clientToken} onReady={setGetNonce} />
)}
{isBraintreeAch(selectedPaymentMethod) && (
  <BraintreeAchForm clientToken={clientToken} businessName="Your Store" onReady={setGetNonce} />
)}
```

`clientToken` comes from the active session after `initiatePaymentSession` (the starter already calls this server action on method selection — read the token from the returned session's `data.client_token`, Step 4 above).

**3. `src/modules/checkout/components/payment-button/index.tsx` — the Place Order path.** The starter switches on provider type (`isStripe(...)`, manual, …). Add a Braintree branch that runs Step 6: get nonce → `initiatePaymentSession` with `{ data: { payment_method_nonce } }` → `placeOrder()` (the starter's existing cart-completion action).

**4. Server actions.** The starter's `initiatePaymentSession` in `src/lib/data/cart.ts` already accepts a `data` payload — no changes needed there.

That's the entire starter diff: one constants entry, one form mount, one button branch.

---

## 12. Testing Your Integration

Work through this list in the **sandbox** environment (`BRAINTREE_ENVIRONMENT=sandbox`):

**Card display & flow**

- [ ] "Credit / Debit Card" appears in the payment list for your region.
- [ ] Selecting it renders the Drop-in form (client token arrived).
- [ ] Test card `4111 1111 1111 1111` (any future expiry, any CVV) → order completes, appears in Medusa Admin **and** the sandbox Braintree Control Panel → Transactions.
- [ ] Decline card `4000 1111 1111 1115` → checkout shows a readable error, no order is created, the customer can retry with `4111...` and succeed **with a fresh nonce**.

**ACH display & flow** (if enabled)

- [ ] "Bank Transfer (ACH)" appears in the payment list.
- [ ] The mandate text is visible and the checkbox is required.
- [ ] A sandbox bank account tokenizes and the order completes as *pending*. Use the test routing/account numbers from [Braintree's ACH testing reference](https://developer.paypal.com/braintree/docs/guides/ach/testing) (sandbox accepts designated test values that simulate settled vs. declined outcomes).
- [ ] After the settlement webhook fires, the payment flips to captured in Medusa. (In sandbox you can trigger settlement from the Control Panel or test webhooks from ⚙ → Webhooks → your destination → "Check URL".)

**3D Secure** (if enabled)

- [ ] With `enable3DSecure: true` server-side and `threeDSecure: true` in Drop-in, Braintree's [3DS test cards](https://developer.paypal.com/braintree/docs/reference/general/testing#3d-secure) trigger the challenge flow and the order completes.

**Hygiene**

- [ ] `pp_imported_braintree` and `pp_system_default` are **not** visible to customers.
- [ ] Refreshing mid-checkout and switching between methods doesn't leave a stale form mounted (teardown works).

---

## 13. Troubleshooting

**The payment list is empty / Braintree options don't appear.**
The list is driven by `/store/payment-providers?region_id=...`. Call it directly (browser dev tools → Network tab) — if the Braintree IDs are missing there, this is a *server-side* issue: provider not enabled for the region, or the plugin didn't load ([Complete Setup Guide troubleshooting](USER-GUIDE.md#18-troubleshooting--faq)). If the IDs *are* in the response but not on screen, your `paymentInfoMap` is missing the entries or a filter is dropping them — check for the exact strings, including `pp_` and the hyphen in `pp_braintree-ach_braintree`.

**"No Braintree client token on the payment session."**
The session was created for a different provider, or session `data` wasn't returned. Log the payment collection after `initiatePaymentSession` and confirm the session's `provider_id` matches what the customer selected.

**Drop-in throws "authorization is invalid".**
The client token is stale, truncated, or from a different environment than the SDK expects. Tokens come from the *server's* configured environment — sandbox server → sandbox tokens. Recreate the session to get a fresh token.

**Every payment fails with a nonce error ("cannot be used more than once" / "unknown payment_method_nonce").**
You're reusing a nonce — most often after a failed first attempt, or by requesting it at form-load time. Request the nonce inside the Place Order handler, every time.

**Cards work; enabling 3DS made everything fail.**
Server and storefront must be switched together: `enable3DSecure: true` requires `threeDSecure: true` in `dropin.create` *and* the amount in `requestPaymentMethod`. See [Step 8](#10-step-8--3d-secure).

**ACH tokenize fails with a validation error.**
Routing number must be a valid 9-digit ABA number (use Braintree's documented sandbox values), and the mandate text must be passed to `tokenize` — omitting `mandateText` is rejected. Ownership/name fields must match the account type (`personal` → first/last name).

**ACH orders never leave "pending".**
That's the settlement webhook not arriving — webhook URL or custom-field setup issue on the server side. Follow [Complete Setup Guide, Steps 7–8](USER-GUIDE.md#9-step-7--set-up-custom-fields-in-braintree); for local dev remember Braintree cannot reach `localhost` (use a tunnel).

**It works locally but not deployed.**
Check the deployed server's `.env` (different machine, different file), that it was restarted after changes, and that your storefront points at the right Medusa backend URL.

---

*Server-side setup, going-live checklist, and non-technical walkthrough: [Complete Setup Guide](USER-GUIDE.md). Plugin options reference: [README](../README.md#provider-options).*
