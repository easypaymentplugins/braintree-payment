import type Braintree from 'braintree';

export type AchVerificationMethod = 'network_check' | 'independent_check' | 'micro_transfers' | 'tokenized_check';

export interface BraintreeOptions extends Braintree.ClientGatewayConfig {
  defaultCurrencyCode?: string;
  environment: 'production' | 'sandbox' | 'development' | 'qa';
  merchantId: string;
  publicKey: string;
  privateKey: string;
  enable3DSecure: boolean;
  savePaymentMethod: boolean;
  webhookSecret: string;
  autoCapture: boolean;
  allowRefundOnRefunded?: boolean;
  /**
   * Merchant account to route ACH (US bank account) transactions through.
   * Required by Braintree when your default merchant account does not support ACH.
   */
  achMerchantAccountId?: string;
  /**
   * Bank account verification method used for ACH transactions.
   * Defaults to `network_check` (instant verification).
   */
  achVerificationMethod?: AchVerificationMethod;
  /** When true, logs important operations to the console for debugging. */
  logging?: boolean;
}

export const PaymentProviderKeys = {
  /** Credit / debit card payments. */
  CARD: 'braintree',
  /** ACH Direct Debit (US bank account) payments. */
  ACH: 'braintree-ach',
  /** Payments imported from another platform whose transactions live in Braintree. */
  IMPORTED: 'imported',
};

export const ACH_VERIFICATION_METHODS: readonly AchVerificationMethod[] = [
  'network_check',
  'independent_check',
  'micro_transfers',
  'tokenized_check',
];

// Flexible map of custom fields returned by Braintree.
// Values are represented as strings by the API.
export type CustomFields = Record<string, string>;

export interface DecodedClientToken {
  version: number;
  authorizationFingerprint: string;
  configUrl: string;
  graphQL: GraphQl;
  clientApiUrl: string;
  environment: string;
  merchantId: string;
  assetsUrl: string;
  authUrl: string;
  venmo: string;
  challenges: string[];
  threeDSecureEnabled: boolean;
  analytics: Analytics;
  paypalEnabled: boolean;
  paypal: Paypal;
}

export interface GraphQl {
  url: string;
  date: string;
  features: string[];
}

export interface Analytics {
  url: string;
}

export interface Paypal {
  billingAgreementsEnabled: boolean;
  environmentNoNetwork: boolean;
  unvettedMerchant: boolean;
  allowHttp: boolean;
  displayName: string;
  clientId: string;
  baseUrl: string;
  assetsUrl: string;
  directBaseUrl: string;
  environment: string;
  braintreeClientId: string;
  merchantAccountId: string;
  currencyIsoCode: string;
}

export interface DecodedClientTokenAuthorization {
  exp: number;
  jti: string;
  sub: string;
  iss: string;
  merchant: Merchant;
  rights: string[];
  scope: string[];
  options: Options;
}

export interface Merchant {
  public_id: string;
  verify_card_by_default: boolean;
  verify_wallet_by_default: boolean;
}

export interface Options {}
