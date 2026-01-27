import { registerAs } from '@nestjs/config';

export default registerAs('paypal', () => ({
  clientId: process.env.PAYPAL_CLIENT_ID ?? '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
  mode: process.env.PAYPAL_MODE ?? 'sandbox', // 'sandbox' or 'live'
  webhookId: process.env.PAYPAL_WEBHOOK_ID ?? '',
}));
