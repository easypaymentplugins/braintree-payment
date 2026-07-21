# Complete Setup Guide — EasyPayment Braintree for Medusa v2

**Who this guide is for:** anyone setting up Braintree payments on a Medusa v2 store — including store owners and managers who are **not developers**. Every step is written in plain language, with exact click-paths and copy-paste blocks. Where a step genuinely needs a developer, the guide says so clearly, and tells you exactly what to send them.

**What you'll have at the end:** a Medusa store that accepts **Credit / Debit Card** payments (and optionally **ACH bank debit** for US customers) through Braintree, tested safely in a sandbox before any real money moves.

---

## Table of Contents

1. [Before You Start — Words You'll See](#1-before-you-start--words-youll-see)
2. [What You Need](#2-what-you-need)
3. [Step 1 — Create a Braintree Sandbox Account](#3-step-1--create-a-braintree-sandbox-account)
4. [Step 2 — Find Your Braintree API Keys](#4-step-2--find-your-braintree-api-keys)
5. [Step 3 — Install the Plugin](#5-step-3--install-the-plugin)
6. [Step 4 — Add Your Keys to the Store](#6-step-4--add-your-keys-to-the-store)
7. [Step 5 — Register the Plugin in Medusa](#7-step-5--register-the-plugin-in-medusa)
8. [Step 6 — Turn On Braintree in the Medusa Admin](#8-step-6--turn-on-braintree-in-the-medusa-admin)
9. [Step 7 — Set Up Custom Fields in Braintree](#9-step-7--set-up-custom-fields-in-braintree)
10. [Step 8 — Set Up Webhooks](#10-step-8--set-up-webhooks)
11. [Step 9 — Connect Your Storefront](#11-step-9--connect-your-storefront-developer-step)
12. [Step 10 — Do a Test Purchase](#12-step-10--do-a-test-purchase)
13. [Optional — ACH Bank Debit (US Bank Accounts)](#13-optional--ach-bank-debit-us-bank-accounts)
14. [Optional — 3D Secure (Extra Card Security)](#14-optional--3d-secure-extra-card-security)
15. [Optional — Imported Payments (Migrating From Another Platform)](#15-optional--imported-payments-migrating-from-another-platform)
16. [Going Live Checklist](#16-going-live-checklist)
17. [Everyday Tasks After Setup](#17-everyday-tasks-after-setup)
18. [Troubleshooting & FAQ](#18-troubleshooting--faq)
19. [Getting Help](#19-getting-help)

---

## 1. Before You Start — Words You'll See

You don't need to memorize these — come back here whenever a term looks unfamiliar.

| Term | What it means in plain language |
|---|---|
| **Medusa** | The software that runs your online store (products, carts, orders). |
| **Braintree** | The payment company (owned by PayPal) that actually moves the money. This plugin connects your store to them. |
| **Plugin** | An add-on you install into Medusa to give it a new ability — here, taking payments through Braintree. |
| **Sandbox** | A free practice version of Braintree. It looks and behaves like the real thing, but **no real money ever moves**. You always set up and test in sandbox first. |
| **Production** | The real, live version of Braintree where actual customer money is charged. You switch to this only at the very end. |
| **API keys / credentials** | Three secret codes (Merchant ID, Public Key, Private Key) that prove to Braintree that requests come from *your* store. Treat the Private Key like a bank password. |
| **`.env` file** | A plain text file on your store's server that holds secret settings like API keys, kept out of the code itself. |
| **Authorize** | Braintree checks the customer's card and puts a hold on the money. |
| **Capture / Settle** | The held money is actually collected and sent toward your bank account. |
| **Refund** | Money is sent back to the customer after capture. |
| **Void** | A payment is cancelled *before* the money was collected — the hold is simply released. |
| **Webhook** | An automatic message Braintree sends to your store when something happens on their side (e.g. "this payment has settled"), so your store's records stay accurate without anyone checking manually. |
| **ACH** | A way for US customers to pay directly from their bank account instead of a card. Cheaper fees, but takes a few business days to clear. |
| **3D Secure (3DS)** | An extra identity check for cards (like a code sent to the customer's phone). Required by law for many European cards; optional elsewhere. |
| **Terminal / command line** | The text window where developers type commands. Whenever this guide needs it, it gives you the exact line to copy and paste. |

---

## 2. What You Need

Check these off before starting:

- [ ] A **Medusa v2 store** (version 2.15 or newer) that is already running. If you don't have one yet, your developer can create one following [Medusa's installation guide](https://docs.medusajs.com/learn/installation).
- [ ] **Access to the store's code and server**, or a developer who has it. Steps 3–5 and 9 involve editing two files; everything else is clicking through websites.
- [ ] An **email address** to register with Braintree.
- [ ] About **45–60 minutes** for the full setup.

> **Working with a developer?** You can do Steps 1, 2, 6, 7, 8, and 10 yourself (they're all done in a web browser). Send your developer this guide with a note: *"Please do Steps 3, 4, 5, and 9."*

---

## 3. Step 1 — Create a Braintree Sandbox Account

The sandbox is free and no company or bank details are needed to start.

1. Open your web browser and go to **[https://www.braintreepayments.com/sandbox](https://www.braintreepayments.com/sandbox)**.
2. Fill in your first name, last name, company name, email, and country. Click **Try the sandbox**.
3. Check your email inbox for a message from Braintree and click the confirmation link.
4. Set your password when prompted.
5. You'll land in the **Braintree sandbox Control Panel** — this is Braintree's dashboard where you'll see test transactions, settings, and your API keys.

> **Tip:** Bookmark [https://sandbox.braintreegateway.com](https://sandbox.braintreegateway.com) — you'll come back here several times.

---

## 4. Step 2 — Find Your Braintree API Keys

Your store needs three codes to talk to Braintree. Here's where they live:

1. Log in to the **sandbox Control Panel** at [https://sandbox.braintreegateway.com](https://sandbox.braintreegateway.com).
2. Click the **gear icon (⚙)** in the top-right corner, then click **API**.
3. Under **API Keys**, you'll see a table. If it's empty, click **Generate New API Key**.
4. In the table row, click **View** in the "Private Key" column.
5. You now see three values. Copy each one into a private note (a password manager is ideal):

   | Name on screen | Example of what it looks like |
   |---|---|
   | **Merchant ID** | `7xk2mqwzr8f3g9td` (16 lowercase letters/numbers) |
   | **Public Key** | `mwjhvzpygnq6d4rk` |
   | **Private Key** | `b1f0c9e2d8a7465fa3e21c98b7d6e5f4` (longer — keep this one extra safe) |

> ⚠️ **The Private Key is a secret.** Never email it, never paste it into a chat, never put it in a shared document. Anyone who has it can act as your store. If it ever leaks, come back to this same page and generate a new key.

---

## 5. Step 3 — Install the Plugin

*This step is done in the terminal, inside your Medusa store's folder. If you're not comfortable with that, hand it to your developer.*

Open a terminal, go to your Medusa store's folder, and run **one** of these (whichever package manager your project uses — if unsure, use the first):

```bash
npm install @easypaymentplugins/medusa-payment-braintree
```

```bash
yarn add @easypaymentplugins/medusa-payment-braintree
```

That's it — the plugin's files are now part of your store. Nothing is active yet; the next two steps switch it on.

---

## 6. Step 4 — Add Your Keys to the Store

*File-editing step — developer territory, but simple copy-paste.*

In your Medusa store's folder there is a file called **`.env`** (it may be hidden — files starting with a dot often are). Open it in any text editor and add these lines at the bottom, replacing the placeholder text with the three values you copied in Step 2:

```env
# --- Braintree (EasyPayment plugin) ---
BRAINTREE_MERCHANT_ID=paste_your_merchant_id_here
BRAINTREE_PUBLIC_KEY=paste_your_public_key_here
BRAINTREE_PRIVATE_KEY=paste_your_private_key_here
BRAINTREE_WEBHOOK_SECRET=paste_your_public_key_here
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_ENABLE_3D_SECURE=false
BRAINTREE_LOGGING=false
```

Notes:

- **No quotes, no spaces** around the `=` sign.
- `BRAINTREE_ENVIRONMENT=sandbox` keeps you in practice mode. You'll change this single word to `production` when going live (Step 16) — nothing else changes.
- For `BRAINTREE_WEBHOOK_SECRET`, using your Public Key value is fine — webhook messages are verified with your gateway credentials.
- The `.env` file must **never** be committed to Git or shared. (Medusa projects exclude it by default.)

Save the file.

---

## 7. Step 5 — Register the Plugin in Medusa

*File-editing step — developer territory.*

Open the file **`medusa-config.ts`** in the root of your Medusa store. Find the `modules` section (or add one), and add the payment module entry below. If a `modules` list already exists, add this object to it:

```ts
import { Modules } from '@medusajs/framework/utils';

module.exports = defineConfig({
  // ... your existing config stays as-is ...
  modules: [
    // ... your other modules stay as-is ...
    {
      resolve: '@medusajs/medusa/payment',
      dependencies: [Modules.CACHE],
      options: {
        providers: [
          {
            resolve: '@easypaymentplugins/medusa-payment-braintree/providers/easypayment-braintree',
            id: 'braintree',
            options: {
              environment: process.env.BRAINTREE_ENVIRONMENT ?? 'sandbox',
              merchantId: process.env.BRAINTREE_MERCHANT_ID,
              publicKey: process.env.BRAINTREE_PUBLIC_KEY,
              privateKey: process.env.BRAINTREE_PRIVATE_KEY,
              webhookSecret: process.env.BRAINTREE_WEBHOOK_SECRET,
              enable3DSecure: process.env.BRAINTREE_ENABLE_3D_SECURE === 'true',
              savePaymentMethod: true,
              autoCapture: true,
              logging: process.env.BRAINTREE_LOGGING === 'true',
            },
          },
        ],
      },
    },
  ],
});
```

What the two most important switches mean (you can change them later):

| Setting | `true` means | `false` means |
|---|---|---|
| `autoCapture` | Money is collected **immediately** when the customer pays. Right for most stores. | Money is only **held**; you collect it manually from the admin when you ship. Common for made-to-order goods. |
| `savePaymentMethod` | Returning customers can pay with a saved card ("one-click"). Cards are stored safely by Braintree, never by your store. | Every purchase requires re-entering card details. |

Now **restart the Medusa server** so it picks up the changes:

```bash
npx medusa develop
```

(or however your project normally starts — e.g. `npm run dev`. On a hosted server, redeploy.)

If the server starts without errors mentioning "Braintree", the plugin is loaded. If it complains about a missing option, re-check Step 4 for typos.

---

## 8. Step 6 — Turn On Braintree in the Medusa Admin

*Back to point-and-click — you can do this yourself.*

The plugin is installed, but each **region** of your store (e.g. "United States", "Europe") chooses which payment methods it offers.

1. Open your **Medusa Admin** in the browser (usually `http://localhost:9000/app` during development, or your live admin URL) and log in.
2. In the left sidebar, click **Settings** (bottom of the list).
3. Click **Regions**.
4. Click the region where you want to accept Braintree payments (e.g. *United States*).
5. Click the **⋯ (three dots)** menu in the region's header and choose **Edit**.
6. Find the **Payment Providers** field and open its dropdown. You'll see the new options:
   - **braintree** → Credit / Debit Card
   - **braintree-ach** → ACH bank debit (US only — see [Step 13](#13-optional--ach-bank-debit-us-bank-accounts))
7. Select **braintree** (add **braintree-ach** too if you want bank payments).
8. Click **Save**.

Repeat for every region that should accept card payments.

---

## 9. Step 7 — Set Up Custom Fields in Braintree

*Point-and-click in the Braintree Control Panel — you can do this yourself. Don't skip this step: it's what lets Braintree's automatic status messages (webhooks) find the right order in your store.*

1. Log in to the **Braintree sandbox Control Panel**.
2. Click the **gear icon (⚙)** → **Account Settings**.
3. Scroll to the **Transactions** section and find **Custom Fields**. Click **Options** / **Add**.
4. Create these three fields, one at a time. For each, choose the option **"Store and Pass Back"**:

   | Display name (anything you like) | API name (must match **exactly**, all lowercase) |
   |---|---|
   | Medusa Payment Session Id | `medusa_payment_session_id` |
   | Cart Id | `cart_id` |
   | Customer Id | `customer_id` |

5. Save.

> **Why this matters:** when a payment settles days later (especially ACH), Braintree tells your store via webhook. The `medusa_payment_session_id` field is the "return address" that links that message back to the exact order. Without it, settlement updates can't be matched.

---

## 10. Step 8 — Set Up Webhooks

*Point-and-click — you can do this yourself, but you need your store's public web address first.*

A webhook is Braintree proactively telling your store "payment X settled" or "payment X was declined at settlement". This keeps order statuses accurate automatically.

1. In the **Braintree Control Panel**, click the **gear icon (⚙)** → **Webhooks**.
2. Click **Create New Webhook**.
3. In **Destination URL**, enter your store's webhook address:

   ```
   https://YOUR-STORE-DOMAIN.com/hooks/payment/braintree_braintree
   ```

   Replace `YOUR-STORE-DOMAIN.com` with your Medusa **server's** real public address.

4. Under notifications, tick at least:
   - **Transaction Settled**
   - **Transaction Settlement Declined**
5. Click **Create Webhook**.

> **Testing locally?** Braintree can't reach `localhost`. Developers can use a tunnel tool (e.g. `ngrok http 9000`) and use the tunnel's `https://…` address in the webhook URL during development. On a real deployed store this isn't needed.

> **Security note:** every incoming webhook is signature-checked against your Braintree credentials before your store acts on it. Fake or tampered messages are rejected automatically.

---

## 11. Step 9 — Connect Your Storefront (Developer Step)

*This step is for your developer. Non-technical readers: forward this section and skip to Step 10 once done.*

> **Full walkthrough available:** this section is the short version. For the complete, copy-paste frontend guide — showing the payment methods in the checkout list, the card form, ACH, 3D Secure, and exact instructions for the official Next.js starter — see the **[Storefront Integration Guide](STOREFRONT-GUIDE.md)**.

The plugin handles everything on the **server** side. The **storefront** (the website customers see) needs a payment form that turns card details into a secure one-time token (a "nonce") using Braintree's client SDK — card numbers never touch your server.

The flow for a developer to implement at checkout:

1. **Create the payment session** via Medusa's standard store API (`POST /store/payment-collections/:id/payment-sessions` with `provider_id: "pp_braintree_braintree"`). The session's `data.client_token` is the Braintree **client token** for initializing the client SDK.
2. **Render the card form** with [Braintree Drop-in UI](https://developer.paypal.com/braintree/docs/start/drop-in) (fastest) or [Hosted Fields](https://developer.paypal.com/braintree/docs/guides/hosted-fields/overview) (fully custom styling), passing it the client token.
3. **On "Place Order"**, request the payment method **nonce** from the Drop-in/Hosted Fields instance.
4. **Update the payment session** with `{ payment_method_nonce: "<nonce>" }` and complete the cart. The plugin then creates and authorizes (and, with `autoCapture`, captures) the Braintree transaction, forwarding your `custom_fields` from Step 7.

Minimal Drop-in sketch:

```js
// 1. client_token comes from the Medusa payment session's data
const dropin = await braintree.dropin.create({
  authorization: clientToken,
  container: '#dropin-container',
});

// 2. When the customer clicks Pay:
const { nonce } = await dropin.requestPaymentMethod();

// 3. Send the nonce back through Medusa's checkout flow
//    (update the payment session data with { payment_method_nonce: nonce }),
//    then complete the cart as usual.
```

For 3D Secure and ACH, see Steps 13–14 — both are client-side variations of the same token → nonce flow. Full client-side references: [Braintree JS SDK docs](https://developer.paypal.com/braintree/docs/start/hello-client).

---

## 12. Step 10 — Do a Test Purchase

Time to see it work — safely, with fake money.

1. Open your storefront in the browser, add any product to the cart, and go to checkout.
2. At the payment step, choose **Credit Card**.
3. Use Braintree's official **test card** (it only works in sandbox):

   | Field | Value |
   |---|---|
   | Card number | `4111 1111 1111 1111` |
   | Expiry date | Any future date, e.g. `12/29` |
   | CVV | Any 3 digits, e.g. `123` |

4. Place the order.
5. **Verify in Medusa Admin:** open **Orders** — your test order should appear, with payment authorized (and captured, if `autoCapture` is on).
6. **Verify in Braintree:** in the sandbox Control Panel, open **Transactions** (magnifying-glass search → Transaction Search → just press Search). Your test transaction should be listed as *Authorized* or *Submitted for Settlement*.
7. **Test a refund:** in Medusa Admin, open the order → payment section → **Refund**. Check in Braintree that the transaction becomes *Voided* (if it hadn't settled yet — that's normal and equivalent) or *Refunded*.

Other useful test cards ([full list](https://developer.paypal.com/braintree/docs/reference/general/testing)):

| Card number | What it simulates |
|---|---|
| `4111 1111 1111 1111` | Successful Visa payment |
| `5555 5555 5555 4444` | Successful Mastercard payment |
| `4000 1111 1111 1115` | **Declined** payment — use this to check your checkout shows a friendly error |

> **Sandbox quirk:** sandbox transactions often sit in "Submitted for Settlement" for a long time. Refunding such a payment correctly *voids* it instead — same outcome for the customer. Developers who want to test the true refund path can set `TEST_FORCE_SETTLED=true` in `.env` (sandbox only; it's ignored everywhere else).

---

## 13. Optional — ACH Bank Debit (US Bank Accounts)

ACH lets US customers pay straight from their bank account. Fees are typically lower than cards, but money takes a few business days to clear.

**Things to know before enabling it:**

- ACH must be **enabled on your Braintree account** (in production this involves approval from Braintree — contact them).
- ACH payments are always collected immediately (no authorize-then-capture-later) — that's a Braintree rule the plugin enforces automatically.
- Because clearing takes days, **webhooks (Step 8) are essential**: the settlement webhook is how your store learns whether the payment actually went through.
- 3D Secure doesn't apply to bank accounts — the plugin knows this and never asks for it on ACH.

**To enable:**

1. Add two lines to `.env` (the merchant account ID comes from Braintree if ACH runs through a dedicated account — otherwise leave it out):

   ```env
   BRAINTREE_ACH_MERCHANT_ACCOUNT_ID=your_ach_merchant_account_id
   ```

2. Add to the plugin `options` in `medusa-config.ts`:

   ```ts
   achMerchantAccountId: process.env.BRAINTREE_ACH_MERCHANT_ACCOUNT_ID,
   achVerificationMethod: 'network_check',
   ```

3. Restart the server, then in Medusa Admin add **braintree-ach** as a payment provider for your US region (same clicks as Step 6).
4. Storefront: the developer adds Braintree's [US bank account component](https://developer.paypal.com/braintree/docs/guides/ach/client-side) next to the card form — same token → nonce flow.

`network_check` verifies the bank account instantly during payment and is the right default for most stores.

---

## 14. Optional — 3D Secure (Extra Card Security)

3D Secure adds a bank-run identity check at checkout (a code texted to the customer, a fingerprint prompt in their banking app, etc.). It's **required for most European cards** (PSD2 law) and reduces fraud liability elsewhere.

To require it on every card payment:

1. In `.env`, change:

   ```env
   BRAINTREE_ENABLE_3D_SECURE=true
   ```

2. Restart the server.
3. **Storefront requirement:** the checkout must run Braintree's 3DS challenge flow when collecting the nonce — Drop-in UI supports this with a flag. Developer reference: [Braintree 3D Secure guide](https://developer.paypal.com/braintree/docs/guides/3d-secure/overview).

> If you enable this on the server but the storefront doesn't do the 3DS flow, payments will be rejected. Flip the switch and update the storefront together.

---

## 15. Optional — Imported Payments (Migrating From Another Platform)

If you moved to Medusa from another platform (Shopify, WooCommerce, …) and your **old orders were already paid through Braintree**, the `imported` provider lets those historical orders live in Medusa without ever re-charging anyone:

- Each imported order's payment is linked to its original Braintree transaction ID.
- Refunding an imported order from Medusa Admin refunds (or voids) the **real original transaction** in Braintree.
- Orders that were already fully refunded before migration can be marked `importedAsRefunded` so Medusa records refunds without touching Braintree at all.
- Optional safety valve: `allowRefundOnRefunded: true` makes a refund that was *already* processed upstream log a warning and record locally, instead of failing the whole operation.

This is a data-migration topic — have your developer read the [Imported Payments section of the README](../README.md#imported-payments-provider) when planning the migration.

---

## 16. Going Live Checklist

When sandbox testing is complete and you're ready for real money, work through this list **in order**:

- [ ] **1. Get a production Braintree account.** Apply at [braintreepayments.com](https://www.braintreepayments.com/) — this is a real merchant application (business details, bank account for payouts). Approval can take days.
- [ ] **2. Get production API keys.** Log in to the **production** Control Panel ([braintreegateway.com](https://www.braintreegateway.com)) and repeat Step 2 there. Production keys are different from sandbox keys.
- [ ] **3. Re-create the custom fields** (Step 7) in the **production** Control Panel — sandbox settings do not carry over.
- [ ] **4. Re-create the webhook** (Step 8) in the **production** Control Panel, pointing at your live store's address.
- [ ] **5. Update `.env` on the live server** with the production values:

  ```env
  BRAINTREE_ENVIRONMENT=production
  BRAINTREE_MERCHANT_ID=your_production_merchant_id
  BRAINTREE_PUBLIC_KEY=your_production_public_key
  BRAINTREE_PRIVATE_KEY=your_production_private_key
  BRAINTREE_WEBHOOK_SECRET=your_production_public_key
  BRAINTREE_LOGGING=false
  ```

- [ ] **6. Make sure `TEST_FORCE_SETTLED` is absent** from the live server's `.env` (it's ignored in production, but it shouldn't be there).
- [ ] **7. Restart / redeploy** the Medusa server.
- [ ] **8. Make one small real purchase yourself** (e.g. a $1 test product) with a real card. Confirm: order appears in Medusa, transaction appears in the production Braintree panel, and the money later settles.
- [ ] **9. Refund your test purchase** from Medusa Admin and confirm the refund shows in Braintree.
- [ ] **10. Check payouts.** In the Braintree Control Panel confirm your bank account is set up to receive settlements.

🎉 You're live.

---

## 17. Everyday Tasks After Setup

| You want to… | Where to do it |
|---|---|
| See if a customer's payment went through | Medusa Admin → **Orders** → open the order → payment section. Cross-check in Braintree Control Panel → Transactions. |
| Refund a customer (full or partial) | Medusa Admin → order → payment → **Refund**, enter the amount. The plugin handles Braintree automatically — including voiding instead of refunding when the money hasn't settled yet (same result for the customer). |
| Collect a held payment (if `autoCapture` is off) | Medusa Admin → order → payment → **Capture**. |
| See why a payment was declined | The checkout error shows Braintree's reason (e.g. "Insufficient Funds (2001)"). Details also appear in Braintree Control Panel → Transactions. |
| Turn on detailed logs while investigating a problem | Set `BRAINTREE_LOGGING=true` in `.env`, restart, reproduce the issue, read the server logs (lines start with `[EasyPayment Braintree]`), then turn it back off. |

---

## 18. Troubleshooting & FAQ

**"braintree" doesn't appear in the payment providers list in Medusa Admin (Step 6).**
The plugin didn't load. Check: (1) the install in Step 3 succeeded, (2) `medusa-config.ts` matches Step 5 exactly, (3) the server was restarted after the changes, (4) server startup logs for a Braintree error.

**The server won't start and mentions a missing Braintree option.**
One of the five required settings (`merchantId`, `publicKey`, `privateKey`, `webhookSecret`, `environment`) is empty or misspelled in `.env`. Compare letter-by-letter with Step 4. Remember: no quotes, no spaces around `=`.

**Customers see "Authentication failed" or every payment fails instantly.**
Almost always mismatched keys and environment — e.g. sandbox keys with `BRAINTREE_ENVIRONMENT=production` or vice versa. All three keys and the environment must come from the *same* Braintree Control Panel.

**The test card is declined in sandbox.**
Make sure you used `4111 1111 1111 1111` with a *future* expiry date. Card `4000 1111 1111 1115` is *supposed* to decline — that's its job.

**Payments authorize but the money is never collected.**
`autoCapture` is `false` and no one is clicking **Capture** on the orders. Either capture manually when you ship, or set `autoCapture: true` (Step 5) and restart.

**Orders stay "pending settlement" forever (especially ACH).**
Your webhook isn't reaching the store. Check the webhook URL (Step 8) is your server's real public address ending in `/hooks/payment/braintree_braintree`, and that the custom field `medusa_payment_session_id` exists in Braintree (Step 7) — it's the link between the webhook and the order.

**A refund in Medusa shows the Braintree transaction as "Voided" instead of "Refunded".**
That's correct behavior, not a bug. If the money hadn't finished settling, the payment is cancelled (voided) rather than refunded — the customer is never charged. The outcome is identical from their point of view.

**Can I use this outside the US?**
Card payments: yes, wherever Braintree operates ([availability list](https://www.braintreepayments.com/country-selection)). ACH: US bank accounts only.

**Where are card numbers stored? Am I responsible for them (PCI)?**
Card numbers go from the customer's browser **directly to Braintree** — they never touch your Medusa server, and the server only ever sees one-time tokens. With saved cards (`savePaymentMethod`), the card lives in Braintree's vault, not your database. This keeps your store in the lightest PCI compliance category (SAQ A) for typical integrations.

**Is it safe to keep `logging: true` in production?**
Prefer off. The logs don't contain card numbers, but they're verbose and meant for debugging sessions, not day-to-day operation.

---

## 19. Getting Help

- **Plugin questions or bugs:** open an issue at [github.com/easypaymentplugins/braintree-payment/issues](https://github.com/easypaymentplugins/braintree-payment/issues) — include what you expected, what happened, and (with `BRAINTREE_LOGGING=true`) the relevant `[EasyPayment Braintree]` log lines. **Never include your Private Key in an issue.**
- **Braintree account questions** (approvals, payouts, ACH enablement, disputes): [Braintree support](https://developer.paypal.com/braintree/help).
- **Medusa platform questions:** [Medusa documentation](https://docs.medusajs.com).
- **Security issues in the plugin:** please follow [SECURITY.md](../SECURITY.md) instead of opening a public issue.
