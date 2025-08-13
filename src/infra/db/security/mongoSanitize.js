const isPlainObject = (v) =>
  v !== null &&
  typeof v === 'object' &&
  (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);

const isBsonLike = (v) =>
  v && typeof v === 'object' && typeof v._bsontype === 'string';

export const escapeRegex = (str = '') =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const deepSanitize = (obj, { allowOps = false, allowed = [] } = {}) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => deepSanitize(v, { allowOps, allowed }));
  }

  if (
    obj === null ||
    typeof obj !== 'object' ||
    isBsonLike(obj) ||
    obj instanceof Date ||
    obj instanceof RegExp ||
    Buffer.isBuffer(obj) ||
    !isPlainObject(obj)
  ) {
    return obj;
  }

  
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.includes('.')) continue;
    if (k.startsWith('$')) {
      if (!allowOps || !allowed.includes(k)) continue;
    }
    out[k] = deepSanitize(v, { allowOps, allowed });
  }
  return out;
};

export const sanitizeQuery = (q = {}, opts = {}) =>
  deepSanitize(q, { allowOps: false, allowed: [], ...opts });

export const sanitizePatch = (patch = {}) =>
  deepSanitize(patch, { allowOps: false, allowed: [] });

export const sanitizeMatch = (match = {}, opts = {}) =>
  sanitizeQuery(match, opts);

