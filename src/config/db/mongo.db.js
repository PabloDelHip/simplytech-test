import { MongoClient } from 'mongodb';

let client = null;
let db = null;

export async function connectMongo(uri, dbName) {
  if (client && db) return { client, db };

  client = new MongoClient(uri, { ignoreUndefined: true });
  await client.connect();
  db = client.db(dbName);

  console.log(`[MongoDB] Conectado a la base de datos: ${dbName}`);
  return { client, db };
}

export function getDb() {
  if (!db) throw new Error('MongoDB no está conectado. Llama a connectMongo primero.');
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Conexión cerrada');
  }
}
