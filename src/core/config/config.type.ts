export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  hostUrl: string;
}

export interface DatabaseConfig {
  url: string;
}

export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface JwtConfig {
  secret: string;
}

export interface MailConfig {
  user: string;
  pass: string;
  senderEmail: string;
}

export interface StripeConfig {
  apiKey: string;
  webhookSecret: string;
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: object;
}

export interface AllConfig {
  app: AppConfig;
  database: DatabaseConfig;
  s3: S3Config;
  jwt: JwtConfig;
  mail: MailConfig;
  stripe: StripeConfig;
  redis: RedisConfig;
}
