import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Body,
} from '@nestjs/common';
import { WalletService } from 'src/wallet/wallet.service';
import { Router } from 'src/core/router';
import { WithdrawStatus } from 'src/generated/prisma/client';
import {
  PayPalWebhookBatchEventTypes,
  type PayPalWebhookEventData,
} from './paypal.webhook.types';

@Controller(Router.PayPal.Webhook)
export class PayPalWebhookController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: PayPalWebhookEventData) {
    if (!body || !body.event_type) {
      return { received: false };
    }

    const eventType = body.event_type as PayPalWebhookBatchEventTypes;
    const status = withdrawalStatusMap[eventType];

    const batchId =
      'batch_header' in body.resource
        ? body.resource.batch_header.payout_batch_id
        : body.resource.payout_batch_id;

    await this.walletService.updateWithdrawalStatus(
      batchId,
      status,
      'errors' in body.resource ? body.resource.errors : undefined,
    );

    return { received: true };
  }
}

const withdrawalStatusMap: Record<
  PayPalWebhookBatchEventTypes,
  WithdrawStatus
> = {
  [PayPalWebhookBatchEventTypes.PAYOUTSBATCH_PROCESSING]:
    WithdrawStatus.processing,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_HELD]: WithdrawStatus.processing,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_SUCCEEDED]:
    WithdrawStatus.completed,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_UNCLAIMED]:
    WithdrawStatus.unclaimed,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_REFUNDED]: WithdrawStatus.failed,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_RETURNED]: WithdrawStatus.failed,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_CANCELED]: WithdrawStatus.failed,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_BLOCKED]: WithdrawStatus.failed,
  [PayPalWebhookBatchEventTypes.PAYOUTS_ITEM_FAILED]: WithdrawStatus.failed,
};
