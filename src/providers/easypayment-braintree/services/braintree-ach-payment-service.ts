import type Braintree from 'braintree';
import BraintreePaymentProcessor, { BraintreeConstructorArgs } from '../core/braintree-payment-processor';
import type { AchVerificationMethod, BraintreeOptions } from '../types';
import { PaymentProviderKeys } from '../types';

const DEFAULT_ACH_VERIFICATION_METHOD: AchVerificationMethod = 'network_check';

/**
 * ACH Direct Debit (US bank account) payment provider.
 *
 * Braintree applies different gateway rules to ACH than to cards:
 * - ACH transactions must be submitted for settlement immediately;
 *   an authorize-only flow is not supported.
 * - 3D Secure does not apply to bank accounts.
 * - The bank account must be verified; `usBankAccountVerificationMethod`
 *   is sent with the sale and with vaulting requests.
 * - ACH usually settles through a dedicated merchant account
 *   (`achMerchantAccountId`).
 */
class BraintreeAchPaymentService extends BraintreePaymentProcessor {
  static identifier = PaymentProviderKeys.ACH;
  options: BraintreeOptions;

  constructor(container: BraintreeConstructorArgs, options: BraintreeOptions) {
    super(container, options);
    this.options = options;
  }

  protected verificationMethod(): AchVerificationMethod {
    return this.options_.achVerificationMethod ?? DEFAULT_ACH_VERIFICATION_METHOD;
  }

  protected buildTransactionOptions(): Braintree.TransactionRequest['options'] {
    return {
      submitForSettlement: true,
      storeInVaultOnSuccess: this.options_.savePaymentMethod,
      storeInVault: this.options_.savePaymentMethod,
      // Not part of the published typings yet, but accepted by the gateway
      // for US bank account transactions.
      usBankAccountVerificationMethod: this.verificationMethod(),
    } as Braintree.TransactionRequest['options'];
  }

  protected buildTransactionRequestOverrides(): Partial<Braintree.TransactionRequest> {
    return this.options_.achMerchantAccountId ? { merchantAccountId: this.options_.achMerchantAccountId } : {};
  }

  protected buildPaymentMethodCreateOverrides(): Record<string, unknown> {
    return {
      options: {
        usBankAccountVerificationMethod: this.verificationMethod(),
        ...(this.options_.achMerchantAccountId
          ? { verificationMerchantAccountId: this.options_.achMerchantAccountId }
          : {}),
      },
    };
  }
}

export default BraintreeAchPaymentService;
