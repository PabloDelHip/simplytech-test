import { getDb } from '../../config/db/mongo.db.js';
import { ObjectId } from 'mongodb';
import { sanitizeQuery, sanitizePatch, sanitizeMatch, escapeRegex as _escapeRegex } from '../../infra/db/security/mongoSanitize.js';
import logger from '../../config/logger.js';

export default class BaseRepository {
  constructor(collectionName) {
    if (!collectionName) throw new Error('collectionName es requerido');
    this.collectionName = collectionName;
  }

  get col() { return getDb().collection(this.collectionName); }

  toObjectId(id) { return id instanceof ObjectId ? id : new ObjectId(String(id)); }

  escapeRegex(str) { return _escapeRegex(str); }
  sanitizeQuery(obj, opts) { return sanitizeQuery(obj, opts); }
  sanitizePatch(obj) { return sanitizePatch(obj); }
  sanitizeMatch(obj, opts) { return sanitizeMatch(obj, opts); }

  async create(doc) {
    logger.debug(`[${this.collectionName}] Creando documento: ${JSON.stringify(doc)}`);
    if (doc?.userId) doc.userId = this.toObjectId(doc.userId);
    const res = await this.col.insertOne(doc);
    logger.debug(`[${this.collectionName}] Documento creado con _id: ${res.insertedId}`);
    return { _id: res.insertedId, ...doc };
  }

  async findOne(filter = {}, options = {}, secure = {}) {
    logger.debug(`[${this.collectionName}] Buscando un documento con filtro: ${JSON.stringify(filter)}`);
    const clean = sanitizeQuery(filter, secure);
    return this.col.findOne(clean, options);
  }

  async findMany(filter = {}, options = {}, secure = {}) {
    logger.debug(`[${this.collectionName}] Buscando múltiples documentos con filtro: ${JSON.stringify(filter)}`);
    const clean = sanitizeQuery(filter, secure);
    const { projection, sort, limit, skip } = options || {};
    let cursor = this.col.find(clean, { projection });
    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);
    return cursor.toArray();
  }

  async updateOne(filter, patch, options = { returnDocument: 'after' }, secure = {}) {
    logger.debug(`[${this.collectionName}] Actualizando documento con filtro: ${JSON.stringify(filter)}, patch: ${JSON.stringify(patch)}`);
    const cleanFilter = sanitizeQuery(filter, secure);
    const cleanPatch  = sanitizePatch(patch);
    const res = await this.col.findOneAndUpdate(
      cleanFilter,
      { $set: cleanPatch },
      { returnDocument: options.returnDocument }
    );
    logger.debug(`[${this.collectionName}] Documento actualizado: ${JSON.stringify(res.value)}`);
    return res;
  }

  async findById(id, options = {}) {
    logger.debug(`[${this.collectionName}] Buscando documento por ID: ${id}`);
    return this.findOne({ _id: this.toObjectId(id) }, options);
  }

  async updateById(id, patch, options = { returnDocument: 'after' }) {
    logger.debug(`[${this.collectionName}] Actualizando documento por ID: ${id}`);
    return this.updateOne({ _id: this.toObjectId(id) }, patch, options);
  }

  async aggregate(pipeline = [], options = {}) {
    logger.debug(`[${this.collectionName}] Ejecutando pipeline de agregación: ${JSON.stringify(pipeline)}`);
    return this.col.aggregate(pipeline, options).toArray();
  }

  async deleteOne(filter = {}, options = {}, secure = {}) {
    logger.debug(`[${this.collectionName}] Eliminando documento con filtro: ${JSON.stringify(filter)}`);
    const clean = sanitizeQuery(filter, secure);
    const res = await this.col.findOneAndDelete(clean, options);
    logger.debug(`[${this.collectionName}] Documento eliminado: ${JSON.stringify(res.value)}`);
    return res;
  }

  async deleteById(id, options = {}) {
    logger.debug(`[${this.collectionName}] Eliminando documento por ID: ${id}`);
    return this.deleteOne({ _id: this.toObjectId(id) }, options);
  }
}
