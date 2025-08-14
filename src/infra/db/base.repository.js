import { getDb } from '../../config/db/mongo.db.js';
import { ObjectId } from 'mongodb';
import logger from '../../config/logger.js';

export default class BaseRepository {
  constructor(collectionName) {
    if (!collectionName) throw new Error('collectionName es requerido');
    this.collectionName = collectionName;
  }

  get col() { return getDb().collection(this.collectionName); }

  toObjectId(id) { return id instanceof ObjectId ? id : new ObjectId(String(id)); }

  async create(doc) {
    logger.debug(`[${this.collectionName}] Creando documento: ${JSON.stringify(doc)}`);
    if (doc?.userId) doc.userId = this.toObjectId(doc.userId);
    const res = await this.col.insertOne(doc);
    logger.debug(`[${this.collectionName}] Documento creado con _id: ${res.insertedId}`);
    return { _id: res.insertedId, ...doc };
  }

  async findOne(filter = {}, options = {}) {
    logger.debug(`[${this.collectionName}] Buscando un documento con filtro: ${JSON.stringify(filter)}`);
    return this.col.findOne(filter, options);
  }

  async findMany(filter = {}, options = {}) {
    logger.debug(`[${this.collectionName}] Buscando múltiples documentos con filtro: ${JSON.stringify(filter)}`);
    const { projection, sort, limit, skip } = options || {};
    let cursor = this.col.find(filter, { projection });
    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);
    return cursor.toArray();
  }

  async updateOne(filter, patch, options = { returnDocument: 'after' }) {
    logger.debug(`[${this.collectionName}] Actualizando documento con filtro: ${JSON.stringify(filter)}, patch: ${JSON.stringify(patch)}`);
    const res = await this.col.findOneAndUpdate(
      filter,
      { $set: patch },
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

  async deleteOne(filter = {}, options = {}) {
    logger.debug(`[${this.collectionName}] Eliminando documento con filtro: ${JSON.stringify(filter)}`);
    const res = await this.col.findOneAndDelete(filter, options);
    logger.debug(`[${this.collectionName}] Documento eliminado: ${JSON.stringify(res.value)}`);
    return res;
  }

  async deleteById(id, options = {}) {
    logger.debug(`[${this.collectionName}] Eliminando documento por ID: ${id}`);
    return this.deleteOne({ _id: this.toObjectId(id) }, options);
  }
}
