import { Injectable } from '@nestjs/common';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import nodemailerMjmlPlugin from 'nodemailer-mjml';
import {
  HOST_URL,
  mailTemplatesPath,
} from 'src/core/constants/paths.constants';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private senderEmail: string;

  constructor(private readonly configService: ConfigService<AllConfig>) {
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.getOrThrow('mail.user', { infer: true }),
        pass: this.configService.getOrThrow('mail.pass', { infer: true }),
      },
    });
    transporter.use(
      'compile',
      nodemailerMjmlPlugin({
        templateFolder: mailTemplatesPath,
      }),
    );

    this.transporter = transporter;
    this.senderEmail = this.configService.getOrThrow('mail.senderEmail', {
      infer: true,
    });
  }

  private generateMessageId(): string {
    const domain = this.senderEmail.split('@')[1] || 'beltacourse.com';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `<${timestamp}-${random}@${domain}>`;
  }

  private getEmailHeaders(): Record<string, string> {
    return {
      'Message-ID': this.generateMessageId(),
      'X-Auto-Response-Suppress': 'All',
      'Auto-Submitted': 'auto-generated',
      'X-Mailer': 'BeltaCourse',
      'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };
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
    const mailOptions: SendMailOptions = {
      from: this.senderEmail,
      subject: emailSubjects[name],
      templateName: name,
      templateData: { ...templateStaticData[name], ...data },
      headers: {
        ...this.getEmailHeaders(),
        ...options.headers,
      },
      ...options,
    };

    // Remove any reply-related headers that might cause Gmail to collapse the email
    if (mailOptions.headers) {
      delete mailOptions.headers['In-Reply-To'];
      delete mailOptions.headers['References'];
    }

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmail(options: Omit<SendMailOptions, 'from'>) {
    await this.transporter.sendMail({
      from: this.senderEmail,
      headers: {
        ...this.getEmailHeaders(),
        ...options.headers,
      },
      ...options,
    });
  }
}

type TemplateName =
  | 'new-user'
  | 'confirm-login'
  | 'invoice-purchase'
  | 'invoice-refund';
export const emailSubjects: Record<TemplateName, string> = {
  'new-user': 'Welcome to BeltaCourse',
  'confirm-login': 'Confirm Login to BeltaCourse',
  'invoice-purchase': 'Purchase Invoice - BeltaCourse',
  'invoice-refund': 'Refund Invoice - BeltaCourse',
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
    }
  | {
      name: 'invoice-purchase';
      data: {
        studentName: string;
        transactionId: string;
        purchaseDate: string;
        courseName: string;
        teacherName: string;
        paidPrice: string;
        currency: string;
      };
    }
  | {
      name: 'invoice-refund';
      data: {
        studentName: string;
        refundId: string;
        transactionId: string;
        refundDate: string;
        courseName: string;
        teacherName: string;
        paidPrice: string;
        currency: string;
      };
    };

const templateStaticData: Record<TemplateName, Record<string, string>> = {
  'new-user': {
    logoLarge: `${HOST_URL}/images/logo/logo-lg-150.png`,
  },
  'confirm-login': {
    logoLarge: `${HOST_URL}/images/logo/logo-lg-150.png`,
  },
  'invoice-purchase': {
    logoLarge: `${HOST_URL}/images/logo/logo-lg-150.png`,
  },
  'invoice-refund': {
    logoLarge: `${HOST_URL}/images/logo/logo-lg-150.png`,
  },
};
