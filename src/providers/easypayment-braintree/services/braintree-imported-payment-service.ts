import { BraintreeConstructorArgs } from '../core/braintree-payment-processor';
import BraintreeImportedPayment from '../core/braintree-imported-payment';
import type { BraintreeOptions } from '../types';
import { PaymentProviderKeys } from '../types';

class BraintreeImportedPaymentService extends BraintreeImportedPayment {
  static identifier = PaymentProviderKeys.IMPORTED;
  options: BraintreeOptions;

  constructor(container: BraintreeConstructorArgs, options: BraintreeOptions) {
    super(container, options);
    this.options = options;
  }
}

export default BraintreeImportedPaymentService;
