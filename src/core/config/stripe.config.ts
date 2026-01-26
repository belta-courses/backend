import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  apiKey: process.env.STRIPE_API_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  checkoutSuccessUrl: process.env.STRIPE_CHECKOUT_SUCCESS_URL ?? '',
  checkoutCancelUrl: process.env.STRIPE_CHECKOUT_CANCEL_URL ?? '',
}));
