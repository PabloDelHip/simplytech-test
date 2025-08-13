import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import HttpServer from '../../http-server.js';
import { connectMongo, getDb, closeMongo } from '../../src/config/db/mongo.db.js';

describe('API (Supertest) con Mongo en memoria', () => {
  let mongod;
  let app;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await connectMongo(uri, 'test');

    const routesModule = await import('../../src/routes/index.js');
    const routes = routesModule.default;

    const http = new HttpServer(routes, 0);
    app = http.listen();

    const db = getDb();
    await db.collection('events').deleteMany({});
    await db.collection('users').deleteMany({});
  });

  afterAll(async () => {
    await closeMongo?.();
    await mongod.stop();
  });

  it('GET / => ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('flujo simple de disponibilidad', async () => {
    const db = getDb();

    const ownerId = (await db.collection('users').insertOne({
      name: 'Owner', email: 'owner@example.com',
    })).insertedId;

    const d = new Date(Date.now() + 24*3600*1000);
    const eventId = (await db.collection('events').insertOne({
      name: 'HTTPConf',
      date: d, dateISO: d.toISOString(),
      location: 'CDMX',
      capacity: 1,
      userId: ownerId,
      attendees: []
    })).insertedId.toString();

    const r1 = await request(app).post(`/events/${eventId}/register`);
    expect(r1.status).toBe(200);

    const r2 = await request(app).post(`/events/${eventId}/register`);
    expect(r2.status).toBe(409);
  });
});
