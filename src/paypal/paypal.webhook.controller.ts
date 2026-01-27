import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Body,
} from '@nestjs/common';
import { PayPalService } from './paypal.service';
import { WalletService } from 'src/wallet/wallet.service';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';
import { Router } from 'src/core/router';
import { WithdrawStatus } from 'src/generated/prisma/client';

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  summary: string;
  resource: {
    batch_header?: {
      payout_batch_id: string;
      batch_status: string;
    };
    payout_item_id?: string;
    transaction_status?: string;
    payout_batch_id?: string;
    errors?: {
      name: string;
      message: string;
      information_link?: string;
      details?: unknown[];
      links?: unknown[];
    };
  };
  create_time: string;
}

@Controller(Router.PayPal.Webhook)
export class PayPalWebhookController {
  constructor(
    private readonly paypalService: PayPalService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService<AllConfig>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Request() req: Request & { body: PayPalWebhookEvent },
    @Headers('paypal-transmission-id') transmissionId: string,
    @Headers('paypal-transmission-time') transmissionTime: string,
    @Headers('paypal-transmission-sig') transmissionSig: string,
    @Headers('paypal-cert-url') certUrl: string,
    @Body() body: PayPalWebhookEvent,
  ) {
    if (!body || !body.event_type) {
      console.error('Invalid webhook payload');
      return { received: false };
    }

    console.log('body', body);
    try {
      const eventType = body.event_type;
      console.log(`Processing PayPal webhook event: ${eventType}`);

      switch (eventType) {
        case 'PAYMENT.PAYOUTSBATCH.PROCESSING': {
          await this.handlePayoutBatchProcessing(body);
          break;
        }

        case 'PAYMENT.PAYOUTSBATCH.SUCCESS': {
          await this.handlePayoutBatchSuccess(body);
          break;
        }

        case 'PAYMENT.PAYOUTSBATCH.DENIED':
        case 'PAYMENT.PAYOUTSBATCH.FAILED': {
          await this.handlePayoutBatchFailed(body);
          break;
        }

        case 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED': {
          await this.handlePayoutItemSuccess(body);
          break;
        }

        case 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED': {
          // UNCLAIMED means the recipient hasn't claimed the payment yet
          await this.handlePayoutItemUnclaimed(body);
          break;
        }

        case 'PAYMENT.PAYOUTS-ITEM.BLOCKED':
        case 'PAYMENT.PAYOUTS-ITEM.CANCELED':
        case 'PAYMENT.PAYOUTS-ITEM.RETURNED':
        case 'PAYMENT.PAYOUTS-ITEM.FAILED': {
          await this.handlePayoutItemFailed(body);
          break;
        }

        default:
          console.log(`Unhandled PayPal webhook event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`Error processing PayPal webhook event:`, error);
      // Return 200 to PayPal to prevent retries for processing errors
    }

    return { received: true };
  }

  private async handlePayoutBatchProcessing(event: PayPalWebhookEvent) {
    const batchId = event.resource?.batch_header?.payout_batch_id;
    if (!batchId) {
      console.error('Missing batch_id in webhook event');
      return;
    }

    try {
      console.log(`Processing payout batch processing for batch: ${batchId}`);
      const status = await this.paypalService.getPayoutStatus(batchId);
      if (status.items && status.items.length > 0) {
        for (const item of status.items) {
          // Set status to processing for all items in the batch
          await this.walletService.updateWithdrawalStatus(
            item.payoutItemId,
            'processing' as WithdrawStatus,
          );
          console.log(
            `Updated withdrawal status to processing for payout item: ${item.payoutItemId}`,
          );
        }
      }
    } catch (error) {
      console.error(`Error handling payout batch processing:`, error);
      throw error;
    }
  }

  private async handlePayoutBatchSuccess(event: PayPalWebhookEvent) {
    const batchId = event.resource?.batch_header?.payout_batch_id;
    if (!batchId) {
      console.error('Missing batch_id in webhook event');
      return;
    }

    try {
      console.log(`Processing payout batch success for batch: ${batchId}`);
      const status = await this.paypalService.getPayoutStatus(batchId);
      if (status.items && status.items.length > 0) {
        for (const item of status.items) {
          if (item.transactionStatus === 'SUCCESS') {
            await this.walletService.updateWithdrawalStatus(
              item.payoutItemId,
              WithdrawStatus.completed,
            );
            console.log(
              `Updated withdrawal status to completed for payout item: ${item.payoutItemId}`,
            );
          } else if (item.transactionStatus === 'UNCLAIMED') {
            // Handle unclaimed status - will be handled by PAYMENT.PAYOUTS-ITEM.UNCLAIMED event
            // But we can also handle it here if needed
            console.log(
              `Payout item ${item.payoutItemId} is unclaimed - waiting for item-level webhook`,
            );
          } else if (
            item.transactionStatus === 'FAILED' ||
            item.transactionStatus === 'DENIED' ||
            item.transactionStatus === 'RETURNED'
          ) {
            await this.walletService.updateWithdrawalStatus(
              item.payoutItemId,
              WithdrawStatus.failed,
              `Payout failed with status: ${item.transactionStatus}`,
            );
            console.log(
              `Updated withdrawal status to failed for payout item: ${item.payoutItemId}`,
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error handling payout batch success:`, error);
      throw error;
    }
  }

  private async handlePayoutBatchFailed(event: PayPalWebhookEvent) {
    const batchId = event.resource?.batch_header?.payout_batch_id;
    if (!batchId) {
      console.error('Missing batch_id in webhook event');
      return;
    }

    try {
      console.log(`Processing payout batch failed for batch: ${batchId}`);
      const status = await this.paypalService.getPayoutStatus(batchId);
      if (status.items && status.items.length > 0) {
        for (const item of status.items) {
          if (
            item.transactionStatus === 'FAILED' ||
            item.transactionStatus === 'DENIED' ||
            item.transactionStatus === 'RETURNED'
          ) {
            await this.walletService.updateWithdrawalStatus(
              item.payoutItemId,
              WithdrawStatus.failed,
              `Payout batch failed or denied. Status: ${item.transactionStatus}`,
            );
            console.log(
              `Updated withdrawal status to failed for payout item: ${item.payoutItemId}`,
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error handling payout batch failed:`, error);
      throw error;
    }
  }

  private async handlePayoutItemSuccess(event: PayPalWebhookEvent) {
    const payoutItemId = event.resource?.payout_item_id;
    if (!payoutItemId) {
      console.error('Missing payout_item_id in webhook event');
      return;
    }

    try {
      console.log(`Processing payout item success for item: ${payoutItemId}`);
      const result = await this.walletService.updateWithdrawalStatus(
        payoutItemId,
        WithdrawStatus.completed,
      );
      if (result) {
        console.log(
          `Updated withdrawal status to completed for payout item: ${payoutItemId}`,
        );
      }
    } catch (error) {
      console.error(`Error handling payout item success:`, error);
      throw error;
    }
  }

  private async handlePayoutItemFailed(event: PayPalWebhookEvent) {
    const payoutItemId = event.resource?.payout_item_id;
    if (!payoutItemId) {
      console.error('Missing payout_item_id in webhook event');
      return;
    }

    const failureReason =
      event.summary || 'Payout item failed, blocked, canceled, or returned';

    try {
      console.log(
        `Processing payout item failed for item: ${payoutItemId}. Reason: ${failureReason}`,
      );
      const result = await this.walletService.updateWithdrawalStatus(
        payoutItemId,
        WithdrawStatus.failed,
        failureReason,
      );
      if (result) {
        console.log(
          `Updated withdrawal status to failed and refunded wallet for payout item: ${payoutItemId}`,
        );
      }
    } catch (error) {
      console.error(`Error handling payout item failed:`, error);
      throw error;
    }
  }

  private async handlePayoutItemUnclaimed(event: PayPalWebhookEvent) {
    const payoutItemId = event.resource?.payout_item_id;
    if (!payoutItemId) {
      console.error('Missing payout_item_id in webhook event');
      return;
    }

    // Extract error name from webhook event
    const errorName = event.resource?.errors?.name;
    const errorMessage = event.resource?.errors?.message;

    try {
      console.log(
        `Processing payout item unclaimed for item: ${payoutItemId}. Error: ${errorName || 'Unknown'}`,
      );
      const result = await this.walletService.updateWithdrawalStatus(
        payoutItemId,
        'unclaimed' as WithdrawStatus,
        errorMessage,
        errorName,
      );
      if (result) {
        console.log(
          `Updated withdrawal status to unclaimed for payout item: ${payoutItemId}`,
        );
      }
    } catch (error) {
      console.error(`Error handling payout item unclaimed:`, error);
      throw error;
    }
  }
}
