import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

export function signToken(payload, options = {}) {
  const secret = env.JWT_SECRET;
  const expiresIn = env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, secret, { expiresIn, ...options });
}

export function verifyToken(token) {
  const secret = env.JWT_SECRET;
  return jwt.verify(token, secret);
}
