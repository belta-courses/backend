import path from 'node:path';

export const PORT = process.env.PORT ?? 3000;

export const HOST_URL = process.env.HOST_URL ?? `http://localhost:${PORT}`;

export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'secret',
};

export const publicPath = path.join(process.cwd(), 'public');
export const mailTemplatesPath = path.join(publicPath, 'email', 'mjml');

export const devEmails = [
  'student@beltacourses.com',
  'teacher@beltacourses.com',
  'admin@beltacourses.com',
  'employee@beltacourses.com',
];

export const jwtAuthName = 'JWT-auth';
