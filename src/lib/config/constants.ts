export const PORT = process.env.PORT ?? 3000;

export const HOST_URL = process.env.HOST_URL ?? `http://localhost:${PORT}`;

export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'secret',
};
