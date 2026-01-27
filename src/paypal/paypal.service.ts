import { Inject, Injectable } from '@nestjs/common';
import * as paypal from '@paypal/payouts-sdk';
import {
  CreateBatchPayoutResponse,
  GetBatchPayoutResponse,
  GetPayoutsItemResponse,
} from '@paypal/payouts-sdk';

@Injectable()
export class PayPalService {
  private environment:
    | paypal.core.SandboxEnvironment
    | paypal.core.LiveEnvironment;
  private client: paypal.core.PayPalHttpClient;

  constructor(
    @Inject('PAYPAL_CLIENT_ID')
    private readonly clientId: string,
    @Inject('PAYPAL_CLIENT_SECRET')
    private readonly clientSecret: string,
    @Inject('PAYPAL_MODE')
    private readonly mode: 'sandbox' | 'live',
  ) {
    if (mode === 'live') {
      this.environment = new paypal.core.LiveEnvironment(
        clientId,
        clientSecret,
      );
    } else {
      this.environment = new paypal.core.SandboxEnvironment(
        clientId,
        clientSecret,
      );
    }
    this.client = new paypal.core.PayPalHttpClient(this.environment);
  }

  async createPayout({
    email,
    amount,
    currency = 'USD',
    senderBatchId,
    note,
  }: {
    email: string;
    amount: number;
    currency?: string;
    senderBatchId?: string;
    note?: string;
  }): Promise<{
    batchId: string;
    batchStatus: string;
    payoutItemId: string;
    payoutItemStatus: string;
  }> {
    const request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody({
      sender_batch_header: {
        sender_batch_id: senderBatchId || `batch_${Date.now()}`,
        email_subject: 'You have a payout!',
        email_message: note || 'You have received a payout from your earnings.',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: currency.toUpperCase(),
          },
          receiver: email,
          note: note || 'Payout from wallet',
          sender_item_id: `item_${Date.now()}`,
        },
      ],
    });

    try {
      const response = await this.client.execute(request);
      const result = response.result as CreateBatchPayoutResponse & {
        items: { payout_item_id: string; transaction_status: string }[];
      };

      if (result.batch_header && result.batch_header.payout_batch_id) {
        const payoutItemId =
          result.items && result.items[0] ? result.items[0].payout_item_id : '';

        return {
          batchId: result.batch_header.payout_batch_id,
          batchStatus: result.batch_header.batch_status || 'PENDING',
          payoutItemId: payoutItemId,
          payoutItemStatus:
            result.items && result.items[0]
              ? result.items[0].transaction_status || 'PENDING'
              : 'PENDING',
        };
      }

      throw new Error('Failed to create payout: Invalid response from PayPal');
    } catch (error) {
      const errorDetails =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PayPal API Error: ${errorDetails}`);
    }
  }

  async getPayoutStatus(batchId: string): Promise<{
    batchStatus: string;
    items?: Array<{
      payoutItemId: string;
      transactionStatus: string;
      payoutItemFee?: string;
    }>;
  }> {
    const request = new paypal.payouts.PayoutsGetRequest(batchId);

    try {
      const response = await this.client.execute(request);
      const result = response.result as GetBatchPayoutResponse;

      if (result.batch_header) {
        const items =
          result.items?.map((item) => ({
            payoutItemId: item.payout_item_id || '',
            transactionStatus: item.transaction_status || 'UNKNOWN',
            payoutItemFee: item.payout_item_fee?.value,
          })) || [];

        return {
          batchStatus: result.batch_header.batch_status || 'UNKNOWN',
          items,
        };
      }

      throw new Error('Failed to retrieve payout status: Invalid response');
    } catch (error) {
      const errorDetails =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PayPal API Error: ${errorDetails}`);
    }
  }

  async getPayoutItemStatus(payoutItemId: string): Promise<{
    transactionStatus: string;
    payoutItemFee?: string;
    payoutBatchId?: string;
  }> {
    const request = new paypal.payouts.PayoutsItemGetRequest(payoutItemId);

    try {
      const response = await this.client.execute(request);
      const result = response.result as GetPayoutsItemResponse;

      return {
        transactionStatus: result.transaction_status || 'UNKNOWN',
        payoutItemFee: result.payout_item_fee?.value,
        payoutBatchId: result.payout_batch_id,
      };
    } catch (error) {
      const errorDetails =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PayPal API Error: ${errorDetails}`);
    }
  }
}
