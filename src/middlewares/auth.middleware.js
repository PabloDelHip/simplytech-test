import { ObjectId } from 'mongodb';
import { verifyToken } from '../support/helpers/jwt.helper.js';
import env from '../config/env.js';

export function auth(req, res, next) {
  if (env.SKIP_AUTH === '1') {
    // Object ID para test
    const fallback = new ObjectId('000000000000000000000001').toString();
    req.user = { id: env.TEST_USER_ID || fallback };
    return next();
  }
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const payload = verifyToken(token);
    req.user = { id: String(payload.sub), ...payload };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
