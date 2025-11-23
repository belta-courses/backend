import path from 'node:path';

export const PORT = process.env.PORT ?? 3000;

export const HOST_URL = process.env.HOST_URL ?? `http://localhost:${PORT}`;

export const publicPath = path.join(process.cwd(), 'public');
export const mailTemplatesPath = path.join(publicPath, 'email', 'mjml');
