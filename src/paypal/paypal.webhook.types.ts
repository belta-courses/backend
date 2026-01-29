export const enum PayPalWebhookBatchEventTypes {
  PAYOUTSBATCH_PROCESSING = 'PAYMENT.PAYOUTSBATCH.PROCESSING',
  PAYOUTS_ITEM_SUCCEEDED = 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED',
  PAYOUTS_ITEM_UNCLAIMED = 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED',
  PAYOUTS_ITEM_REFUNDED = 'PAYMENT.PAYOUTS-ITEM.REFUNDED',
  PAYOUTS_ITEM_RETURNED = 'PAYMENT.PAYOUTS-ITEM.RETURNED',
  PAYOUTS_ITEM_CANCELED = 'PAYMENT.PAYOUTS-ITEM.CANCELED',
  PAYOUTS_ITEM_BLOCKED = 'PAYMENT.PAYOUTS-ITEM.BLOCKED',
  PAYOUTS_ITEM_FAILED = 'PAYMENT.PAYOUTS-ITEM.FAILED',
  PAYOUTS_ITEM_HELD = 'PAYMENT.PAYOUTS-ITEM.HELD',
}

export interface PayPalWebhookEventData {
  id: string;
  create_time: Date;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: BatchResource | ItemResource;
  links: Link[];
  event_version: string;
}

interface Link {
  href: string;
  rel: string;
  method: string;
  encType?: string;
}

interface ItemResource {
  transaction_id: string;
  payout_item_fee: Amount;
  transaction_status: string;
  time_processed: Date;
  payout_item: PayoutItem;
  links: Link[];
  payout_item_id: string;
  payout_batch_id: string;
  errors?: {
    name: string;
    message: string;
  };
}

interface PayoutItem {
  recipient_type: string;
  amount: Amount;
  note: string;
  receiver: string;
  sender_item_id: string;
}

interface BatchResource {
  batch_header: BatchHeader;
  links: Link[];
}

interface BatchHeader {
  payout_batch_id: string;
  batch_status: string;
  time_created: Date;
  sender_batch_header: SenderBatchHeader;
  amount: Amount;
  fees: Amount;
  payments: number;
}

interface Amount {
  currency: string;
  value: string;
}

interface SenderBatchHeader {
  sender_batch_id: string;
}
