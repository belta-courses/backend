import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/payouts-sdk';
import { GetBatchPayoutResponse } from '@paypal/payouts-sdk';
import { AllConfig } from 'src/core/config/config.type';

@Injectable()
export class PayPalService {
  private environment:
    | paypal.core.SandboxEnvironment
    | paypal.core.LiveEnvironment;
  private client: paypal.core.PayPalHttpClient;

  constructor(private readonly configService: ConfigService<AllConfig>) {
    const clientId = this.configService.getOrThrow('paypal.clientId', {
      infer: true,
    });
    const clientSecret = this.configService.getOrThrow('paypal.clientSecret', {
      infer: true,
    });
    const mode = this.configService.getOrThrow('paypal.mode', {
      infer: true,
    });

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
  }) {
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
      const { result } = await this.client.execute(request);
      if (
        !result ||
        !result.batch_header ||
        !result.batch_header.payout_batch_id
      ) {
        throw new Error(
          'Failed to create payout: Invalid response from PayPal',
        );
      }

      const getPayoutStatus = await this.getPayoutStatus(
        result.batch_header.payout_batch_id,
      );

      if ((getPayoutStatus.items || []).length === 0) {
        throw new Error('Failed to create payout: No items in payout');
      }

      const payoutItemId = getPayoutStatus.items![0].payoutItemId;

      return { batchId: result.batch_header.payout_batch_id, payoutItemId };
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
}
