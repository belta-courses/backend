import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @Inject('STRIPE_API_KEY')
    private readonly apiKey: string,
  ) {
    this.stripe = new Stripe(this.apiKey, { apiVersion: '2025-12-15.clover' });
  }

  async createCheckoutSession({
    amount,
    currency,
    successUrl,
    cancelUrl,
    metadata,
    customerEmail,
  }: {
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    customerEmail?: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: metadata?.courseName || 'Course Purchase',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      customer_email: customerEmail,
    });
  }

  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }

  async createConnectAccount(email: string): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      type: 'express',
      country: 'AE',
      email,
    });
  }

  async createAccountLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string,
  ): Promise<Stripe.AccountLink> {
    return this.stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
  }

  async createTransfer({
    amount,
    currency,
    destination,
    metadata,
  }: {
    amount: number;
    currency: string;
    destination: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Transfer> {
    return this.stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      destination,
      metadata,
    });
  }

  async retrieveAccount(accountId: string): Promise<Stripe.Account> {
    return this.stripe.accounts.retrieve(accountId);
  }

  async createBankAccountToken({
    accountNumber,
    routingNumber,
    accountHolderName,
    accountHolderType,
    country,
    currency,
  }: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    accountHolderType: 'individual' | 'company';
    country: string;
    currency: string;
  }): Promise<Stripe.Token> {
    return this.stripe.tokens.create({
      bank_account: {
        country,
        currency: currency.toLowerCase(),
        account_number: accountNumber,
        routing_number: routingNumber,
        account_holder_name: accountHolderName,
        account_holder_type: accountHolderType,
      },
    });
  }

  async createPayout({
    amount,
    currency,
    destination,
    metadata,
    method = 'standard',
  }: {
    amount: number;
    currency: string;
    destination: string;
    metadata?: Record<string, string>;
    method?: 'standard' | 'instant';
  }): Promise<Stripe.Payout> {
    return this.stripe.payouts.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      destination,
      metadata,
      method,
    });
  }

  async retrievePayout(payoutId: string): Promise<Stripe.Payout> {
    return this.stripe.payouts.retrieve(payoutId);
  }

  async retrieveToken(tokenId: string): Promise<Stripe.Token> {
    return this.stripe.tokens.retrieve(tokenId);
  }

  async getAccountId(): Promise<string> {
    // Retrieve the default account (platform account)
    const account = await this.stripe.accounts.retrieve();
    return account.id;
  }

  async createExternalAccount({
    accountId,
    bankAccountToken,
  }: {
    accountId: string;
    bankAccountToken: string;
  }): Promise<Stripe.ExternalAccount> {
    return this.stripe.accounts.createExternalAccount(accountId, {
      external_account: bankAccountToken,
    });
  }

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
