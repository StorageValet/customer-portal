import jwt from 'jsonwebtoken';
const TTL_MINUTES = 20;
export function signMagicToken(payload: { email: string }) {
  const secret = process.env.JWT_SECRET || 'dev-jwt';
  return jwt.sign(payload, secret, { expiresIn: `${TTL_MINUTES}m` });
}
export function verifyMagicToken(token: string): { email: string } {
  const secret = process.env.JWT_SECRET || 'dev-jwt';
  return jwt.verify(token, secret) as any;
}
