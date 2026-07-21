import { ModuleProvider, Modules } from '@medusajs/framework/utils';
import { BraintreeAchPaymentService, BraintreeImportedPaymentService, BraintreePaymentService } from './services';

const services = [BraintreePaymentService, BraintreeAchPaymentService, BraintreeImportedPaymentService];

export default ModuleProvider(Modules.PAYMENT, {
  services,
});
