import BraintreePaymentProcessor, { BraintreeConstructorArgs } from '../core/braintree-payment-processor';
import type { BraintreeOptions } from '../types';
import { PaymentProviderKeys } from '../types';

class BraintreePaymentService extends BraintreePaymentProcessor {
  static identifier = PaymentProviderKeys.CARD;
  options: BraintreeOptions;

  constructor(container: BraintreeConstructorArgs, options: BraintreeOptions) {
    super(container, options);
    this.options = options;
  }
}

export default BraintreePaymentService;
