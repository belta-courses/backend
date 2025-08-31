import { Injectable, OnModuleInit } from '@nestjs/common';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { mailTemplatesPath } from 'src/lib/utils/path';
import nodemailerMjmlPlugin from 'nodemailer-mjml';

const HOST_URL =
  process.env.HOST_URL || `http://localhost:${process.env.PORT || '3000'}`;

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter;
  private senderEmail: string;

  onModuleInit() {
    const { NODEMAILER_USER, NODEMAILER_PASS, NODEMAILER_SENDER_EMAIL } =
      process.env;

    if (!NODEMAILER_USER) throw new Error('NODEMAILER_USER is not set');
    if (!NODEMAILER_PASS) throw new Error('NODEMAILER_PASS is not set');
    if (!NODEMAILER_SENDER_EMAIL)
      throw new Error('NODEMAILER_SENDER_EMAIL is not set');

    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: NODEMAILER_USER,
        pass: NODEMAILER_PASS,
      },
    });
    transporter.use(
      'compile',
      nodemailerMjmlPlugin({ templateFolder: mailTemplatesPath }),
    );

    this.transporter = transporter;
    this.senderEmail = NODEMAILER_SENDER_EMAIL;
  }

  async sendTemplate({
    name,
    data,
    ...options
  }: TemplateData &
    Omit<
      SendMailOptions,
      'from' | 'subject' | 'templateName' | 'templateData'
    >): Promise<void> {
    await this.transporter.sendMail({
      from: this.senderEmail,
      subject: emailSubjects[name],
      templateName: name,
      templateData: { ...templateStaticData[name], ...data },
      ...options,
    });
  }

  async sendEmail(options: Omit<SendMailOptions, 'from'>) {
    await this.transporter.sendMail({ from: this.senderEmail, ...options });
  }
}

type TemplateName = 'new-user' | 'confirm-login';
export const emailSubjects: Record<TemplateName, string> = {
  'new-user': 'Welcome to BeltaCourse',
  'confirm-login': 'Confirm Login to BeltaCourse',
};

type TemplateData =
  | {
      name: 'new-user';
      data: {
        name: string;
        confirmUrl: string;
      };
    }
  | {
      name: 'confirm-login';
      data: {
        name: string;
        confirmUrl: string;
        expirIn: string;
      };
    };

const templateStaticData: Record<TemplateName, Record<string, string>> = {
  'new-user': {
    logoLarge: `${HOST_URL}/images/logo/logo-lg-150.png`,
  },
  'confirm-login': {
    logoLarge: `${HOST_URL}/images/logo/logo-lg-150.png`,
  },
};
