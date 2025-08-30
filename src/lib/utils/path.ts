import path from 'node:path';

export const publicPath = path.join(process.cwd(), 'public');
export const mailTemplatesPath = path.join(publicPath, 'email', 'mjml');
