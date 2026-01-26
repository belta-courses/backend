import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  NotFoundException,
} from '@nestjs/common';

import { StripeService } from './stripe.service';
import { PurchasesService } from 'src/purchases/purchases.service';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';
import { Router } from 'src/core/router';
import Stripe from 'stripe';

@Controller(Router.Stripe.Webhook)
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly purchasesService: PurchasesService,
    private readonly configService: ConfigService<AllConfig>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Request() req: Request & { body: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.getOrThrow(
      'stripe.webhookSecret',
      {
        infer: true,
      },
    );

    // Get raw body - with express.raw(), body is a Buffer
    const payload = req.body;

    if (!payload) {
      throw new Error('Missing raw body');
    }

    // Convert Buffer to string for Stripe verification
    const payloadString = Buffer.isBuffer(payload)
      ? payload.toString('utf8')
      : payload;

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        payloadString,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw err;
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log(
            `Processing checkout.session.completed for session: ${session.id}, payment_status: ${session.payment_status}`,
          );
          // Only process if payment was successful
          if (session.payment_status === 'paid') {
            try {
              await this.purchasesService.completePurchaseFromWebhook(
                session.id,
              );
            } catch (error) {
              // If transaction not found (e.g., test events), log but don't fail
              if (error instanceof NotFoundException) {
                console.warn(
                  `Transaction not found for session ${session.id}. This is normal for test events without real transactions.`,
                );
              } else {
                throw error; // Re-throw other errors
              }
            }
          } else if (session.payment_status === 'unpaid') {
            // Mark transaction as canceled if payment was not completed
            await this.purchasesService.cancelTransaction(session.id);
          }
          break;
        }

        case 'checkout.session.async_payment_failed': {
          const session = event.data.object;
          console.log(
            `Processing checkout.session.async_payment_failed for session: ${session.id}`,
          );
          await this.purchasesService.rejectTransaction(session.id);
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      // Return 200 to Stripe to prevent retries for processing errors
      // Log the error for debugging
    }

    return { received: true };
  }
}
