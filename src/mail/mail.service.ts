import { Injectable } from '@nestjs/common';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import nodemailerMjmlPlugin from 'nodemailer-mjml';
import { HOST_URL, mailTemplatesPath } from 'src/core/config/constants.config';
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
