import { registerAs } from '@nestjs/config';
import { MailConfig } from './config.type';

export default registerAs<MailConfig>('mail', () => ({
  user: process.env.NODEMAILER_USER ?? '',
  pass: process.env.NODEMAILER_PASS ?? '',
  senderEmail: process.env.NODEMAILER_SENDER_EMAIL ?? '',
}));
