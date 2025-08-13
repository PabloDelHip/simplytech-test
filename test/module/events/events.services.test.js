import { jest, describe, test, expect } from '@jest/globals';
import EventsService from '../../../src/modules/events/events.service.js';

const clone = (o) => JSON.parse(JSON.stringify(o));

const makeRepo = (eventDoc = null) => {
  const state = { event: eventDoc ? clone(eventDoc) : null };

  return {
    addAttendeeIfAvailable: jest.fn(async (eventId, userId) => {
      if (!state.event || state.event._id !== eventId) return null;

      const attendees = state.event.attendees ?? [];
      const capacity  = state.event.capacity ?? 0;
      const yaInscrito = attendees.some(a => String(a) === String(userId));
      const hayCupo    = attendees.length < capacity;

      if (!yaInscrito && hayCupo) {
        state.event.attendees = [...attendees, userId];
        return clone(state.event);
      }
      return null;
    }),
    findById: jest.fn(async (eventId) => {
      if (!state.event || state.event._id !== eventId) return null;
      return clone(state.event);
    }),
  };
};

describe('Validación de disponibilidad en reservas', () => {
  test('registra si hay cupo', async () => {
    const event = { _id: 'E1', name: 'NodeConf', capacity: 2, attendees: [] };
    const repo = makeRepo(event);
    const service = new EventsService(repo);

    const res = await service.registerUserToEvent({ eventId: 'E1', userId: 'U1' });

    expect(repo.addAttendeeIfAvailable).toHaveBeenCalledWith('E1', 'U1');
    expect(res).toEqual({ id: 'E1', name: 'NodeConf', attendeesCount: 1, capacity: 2 });
    expect((await repo.findById('E1')).attendees).toEqual(['U1']);
  });

  test('409 si ya está registrado', async () => {
    const event = { _id: 'E2', name: 'JSConf', capacity: 2, attendees: ['U1'] };
    const repo = makeRepo(event);
    const service = new EventsService(repo);

    await expect(service.registerUserToEvent({ eventId: 'E2', userId: 'U1' }))
      .rejects.toMatchObject({ status: 409, message: 'Ya estás registrado en este evento' });
  });

  test('409 si lleno', async () => {
    const event = { _id: 'E3', name: 'PyConf', capacity: 2, attendees: ['U1', 'U2'] };
    const repo = makeRepo(event);
    const service = new EventsService(repo);

    await expect(service.registerUserToEvent({ eventId: 'E3', userId: 'U3' }))
      .rejects.toMatchObject({ status: 409, message: 'El evento está lleno' });
  });

  test('404 si el evento no existe', async () => {
    const repo = makeRepo(null);
    const service = new EventsService(repo);

    await expect(service.registerUserToEvent({ eventId: 'NOPE', userId: 'U1' }))
      .rejects.toMatchObject({ status: 404, message: 'Evento no encontrado' });
  });

  test('400 si el repo no actualiza y no aplica ninguna causa (fallback)', async () => {
    const event = { _id: 'E4', name: 'WeirdConf', capacity: 2, attendees: [] };
    const repo = makeRepo(event);
    repo.addAttendeeIfAvailable.mockResolvedValueOnce(null);

    const service = new EventsService(repo);
    await expect(service.registerUserToEvent({ eventId: 'E4', userId: 'U1' }))
      .rejects.toMatchObject({ status: 400, message: 'No fue posible registrar en el evento' });
  });
});
