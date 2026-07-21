import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MedusaError } from '@medusajs/framework/utils';
import type { AuthorizePaymentInput, SavePaymentMethodInput } from '@medusajs/types';
import BraintreeAchPaymentService from '../../services/braintree-ach-payment-service';
import type { BraintreeConstructorArgs } from '../braintree-payment-processor';
import type { BraintreeOptions } from '../../types';

const buildService = (overrideOptions?: Partial<BraintreeOptions>) => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;
  const cache = { get: jest.fn(), set: jest.fn() } as any;

  const container: BraintreeConstructorArgs = { logger, cache };

  const options = {
    environment: 'sandbox' as const,
    merchantId: 'merchant',
    publicKey: 'public',
    privateKey: 'private',
    enable3DSecure: false,
    savePaymentMethod: false,
    webhookSecret: 'whsec',
    autoCapture: false,
    logging: false,
    ...overrideOptions,
  } as BraintreeOptions;

  const service = new BraintreeAchPaymentService(container, options);

  const gateway = {
    transaction: {
      sale: jest.fn(),
      find: jest.fn(),
    },
    paymentMethod: {
      create: jest.fn(),
    },
  } as any;

  (service as any).gateway = gateway;

  return { service, gateway };
};

const authorizeInput = (): AuthorizePaymentInput =>
  ({
    data: {
      amount: 25,
      currency_code: 'USD',
      payment_method_nonce: 'fake-us-bank-nonce',
    },
    context: {},
  }) as unknown as AuthorizePaymentInput;

const settledTransaction = (status = 'settlement_pending') => ({
  id: 'ach_tx_1',
  status,
  amount: '25.00',
});

describe('BraintreeAchPaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers under the braintree-ach identifier', () => {
    expect(BraintreeAchPaymentService.identifier).toBe('braintree-ach');
  });

  describe('authorizePayment (sale request shape)', () => {
    it('always submits for settlement, even when autoCapture is false', async () => {
      const { service, gateway } = buildService({ autoCapture: false });
      gateway.transaction.sale.mockResolvedValue({ success: true, transaction: settledTransaction() });
      gateway.transaction.find.mockResolvedValue(settledTransaction());

      await service.authorizePayment(authorizeInput());

      const request = gateway.transaction.sale.mock.calls[0][0];
      expect(request.options.submitForSettlement).toBe(true);
    });

    it('sends the default network_check verification method', async () => {
      const { service, gateway } = buildService();
      gateway.transaction.sale.mockResolvedValue({ success: true, transaction: settledTransaction() });
      gateway.transaction.find.mockResolvedValue(settledTransaction());

      await service.authorizePayment(authorizeInput());

      const request = gateway.transaction.sale.mock.calls[0][0];
      expect(request.options.usBankAccountVerificationMethod).toBe('network_check');
    });

    it('honors a configured achVerificationMethod', async () => {
      const { service, gateway } = buildService({ achVerificationMethod: 'micro_transfers' });
      gateway.transaction.sale.mockResolvedValue({ success: true, transaction: settledTransaction() });
      gateway.transaction.find.mockResolvedValue(settledTransaction());

      await service.authorizePayment(authorizeInput());

      const request = gateway.transaction.sale.mock.calls[0][0];
      expect(request.options.usBankAccountVerificationMethod).toBe('micro_transfers');
    });

    it('never requests 3D Secure, even when enable3DSecure is true', async () => {
      const { service, gateway } = buildService({ enable3DSecure: true });
      gateway.transaction.sale.mockResolvedValue({ success: true, transaction: settledTransaction() });
      gateway.transaction.find.mockResolvedValue(settledTransaction());

      await service.authorizePayment(authorizeInput());

      const request = gateway.transaction.sale.mock.calls[0][0];
      expect(request.options.threeDSecure).toBeUndefined();
    });

    it('routes through the configured ACH merchant account', async () => {
      const { service, gateway } = buildService({ achMerchantAccountId: 'ach_merchant_account' });
      gateway.transaction.sale.mockResolvedValue({ success: true, transaction: settledTransaction() });
      gateway.transaction.find.mockResolvedValue(settledTransaction());

      await service.authorizePayment(authorizeInput());

      const request = gateway.transaction.sale.mock.calls[0][0];
      expect(request.merchantAccountId).toBe('ach_merchant_account');
    });

    it('omits merchantAccountId when no ACH merchant account is configured', async () => {
      const { service, gateway } = buildService();
      gateway.transaction.sale.mockResolvedValue({ success: true, transaction: settledTransaction() });
      gateway.transaction.find.mockResolvedValue(settledTransaction());

      await service.authorizePayment(authorizeInput());

      const request = gateway.transaction.sale.mock.calls[0][0];
      expect(request.merchantAccountId).toBeUndefined();
    });

    it('vaults the bank account when savePaymentMethod is enabled', async () => {
      const { service, gateway } = buildService({ savePaymentMethod: true });
      gateway.transaction.sale.mockResolvedValue({ success: true, transaction: settledTransaction() });
      gateway.transaction.find.mockResolvedValue(settledTransaction());

      await service.authorizePayment(authorizeInput());

      const request = gateway.transaction.sale.mock.calls[0][0];
      expect(request.options.storeInVault).toBe(true);
      expect(request.options.storeInVaultOnSuccess).toBe(true);
    });
  });

  describe('savePaymentMethod', () => {
    const saveInput = (): SavePaymentMethodInput =>
      ({
        data: {
          amount: 25,
          currency_code: 'USD',
          payment_method_nonce: 'fake-us-bank-nonce',
        },
        context: {
          account_holder: { data: { id: 'bt_customer_1' } },
        },
      }) as unknown as SavePaymentMethodInput;

    it('passes the verification method when vaulting', async () => {
      const { service, gateway } = buildService();
      gateway.paymentMethod.create.mockResolvedValue({
        success: true,
        paymentMethod: { token: 'pm_token_1' },
      });

      const result = await service.savePaymentMethod(saveInput());

      expect(result.id).toBe('pm_token_1');
      const request = gateway.paymentMethod.create.mock.calls[0][0];
      expect(request.customerId).toBe('bt_customer_1');
      expect(request.options.usBankAccountVerificationMethod).toBe('network_check');
    });

    it('passes the ACH merchant account for verification when configured', async () => {
      const { service, gateway } = buildService({ achMerchantAccountId: 'ach_merchant_account' });
      gateway.paymentMethod.create.mockResolvedValue({
        success: true,
        paymentMethod: { token: 'pm_token_1' },
      });

      await service.savePaymentMethod(saveInput());

      const request = gateway.paymentMethod.create.mock.calls[0][0];
      expect(request.options.verificationMerchantAccountId).toBe('ach_merchant_account');
    });
  });

  describe('validateOptions', () => {
    const baseOptions = {
      environment: 'sandbox',
      merchantId: 'merchant',
      publicKey: 'public',
      privateKey: 'private',
      webhookSecret: 'whsec',
    } as BraintreeOptions;

    it('accepts a valid achVerificationMethod', () => {
      expect(() =>
        BraintreeAchPaymentService.validateOptions({ ...baseOptions, achVerificationMethod: 'network_check' }),
      ).not.toThrow();
    });

    it('rejects an invalid achVerificationMethod', () => {
      expect(() =>
        BraintreeAchPaymentService.validateOptions({
          ...baseOptions,
          achVerificationMethod: 'telepathy' as any,
        }),
      ).toThrow(MedusaError);
    });

    it('rejects a non-string achMerchantAccountId', () => {
      expect(() =>
        BraintreeAchPaymentService.validateOptions({ ...baseOptions, achMerchantAccountId: 42 as any }),
      ).toThrow(MedusaError);
    });
  });
});
