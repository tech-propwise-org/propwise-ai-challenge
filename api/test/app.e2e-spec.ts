import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { stableId } from '../src/db/stable-id';

describe('CRM API (against the test database)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    // A server that is already listening: otherwise supertest starts one per request, and 20 requests at once
    // trigger Node's "possible memory leak" listener warning.
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  /** Runs `make(1..count)`, 20 at a time, so slow laptops stay well inside the time limit. */
  async function inBatches(count: number, make: (i: number) => Promise<unknown>): Promise<void> {
    for (let start = 1; start <= count; start += 20) {
      await Promise.all(Array.from({ length: Math.min(20, count - start + 1) }, (_, k) => make(start + k)));
    }
  }

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'challenge123' })
      .expect(200);
    return response.body.accessToken;
  }

  it('says which timezone the API runs in', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toEqual({ ok: true, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  });

  it('rejects a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'sara@marinabay.test', password: 'nope' })
      .expect(401);
  });

  it('needs a token for every CRM route', async () => {
    await request(app.getHttpServer()).get('/leads').expect(401);
    await request(app.getHttpServer()).get('/properties').expect(401);
  });

  it("lists only the agent's own agency's leads, with each lead's last message", async () => {
    const token = await login('sara@marinabay.test');
    const response = await request(app.getHttpServer())
      .get('/leads?limit=100')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const names = response.body.items.map((lead: { name: string }) => lead.name);
    expect(names).toContain('Karim Mansour');
    expect(names).not.toContain('Nadia Rahman');

    const karim = response.body.items.find((lead: { name: string }) => lead.name === 'Karim Mansour');
    expect(karim.lastMessage.body).toContain('Dubai Marina');
  });

  it("returns 404 for another agency's lead", async () => {
    const token = await login('sara@marinabay.test');
    await request(app.getHttpServer())
      .get(`/leads/${stableId('lead', 'nadia')}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('filters properties', async () => {
    const token = await login('sara@marinabay.test');
    const response = await request(app.getHttpServer())
      .get('/properties')
      .query({ area: 'dubai marina', minBedrooms: 2, maxBedrooms: 2, maxPriceAed: 2100000, status: 'available' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.items.length).toBeGreaterThan(0);
    for (const property of response.body.items) {
      expect(property).toMatchObject({ area: 'Dubai Marina', bedrooms: 2, status: 'available' });
      expect(property.priceAed).toBeLessThanOrEqual(2100000);
      expect(property.reference.startsWith('MBR-')).toBe(true);
    }
  });

  it('lets each agency use its own listing codes, and says nothing about the other agency', async () => {
    const token = await login('omar@desertkey.test');
    const listing = {
      reference: 'MBR-1001',
      title: 'Desert Key code that happens to match Marina Bay',
      area: 'Dubai Marina',
      type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      sizeSqft: 700,
      priceAed: 1_100_000,
      description: 'Test listing',
    };
    await request(app.getHttpServer()).post('/properties').set('Authorization', `Bearer ${token}`).send(listing).expect(201);
    await request(app.getHttpServer()).post('/properties').set('Authorization', `Bearer ${token}`).send(listing).expect(409);
  });

  it('rejects times without a timezone offset or that are not calendar dates', async () => {
    const token = await login('sara@marinabay.test');
    const leadId = stableId('lead', 'karim');
    for (const dueAt of ['2030-01-02T10:00:00', '2026-W42', '2026-289']) {
      await request(app.getHttpServer())
        .post(`/leads/${leadId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Call Karim', dueAt })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post(`/leads/${leadId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ direction: 'inbound', channel: 'whatsapp', body: 'Hi', sentAt: '2030-01-02T10:00:00' })
      .expect(400);
  });

  it('answers 400, not 500, for a price beyond what the database stores', async () => {
    const token = await login('sara@marinabay.test');
    await request(app.getHttpServer())
      .get('/properties')
      .query({ maxPriceAed: 3_000_000_000 })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it("returns a lead's newest 200 messages, oldest first, with the total", async () => {
    const token = await login('sara@marinabay.test');
    const auth = { Authorization: `Bearer ${token}` };
    const lead = await request(app.getHttpServer()).post('/leads').set(auth).send({ name: 'Chatty', source: 'whatsapp' }).expect(201);
    await inBatches(205, (i) =>
      request(app.getHttpServer())
        .post(`/leads/${lead.body.id}/messages`)
        .set(auth)
        .send({ direction: 'inbound', channel: 'whatsapp', body: `message ${i}`, sentAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString() })
        .expect(201),
    );

    const detail = await request(app.getHttpServer()).get(`/leads/${lead.body.id}`).set(auth).expect(200);
    expect(detail.body.messageCount).toBe(205);
    expect(detail.body.messages).toHaveLength(200);
    expect(detail.body.messages[0].body).toBe('message 6');
    expect(detail.body.messages[199].body).toBe('message 205');
  }, 120_000);

  it('says how many tasks a lead has when the list is cut at 100', async () => {
    const token = await login('sara@marinabay.test');
    const auth = { Authorization: `Bearer ${token}` };
    const lead = await request(app.getHttpServer()).post('/leads').set(auth).send({ name: 'Busy', source: 'website' }).expect(201);
    await inBatches(101, (i) =>
      request(app.getHttpServer()).post(`/leads/${lead.body.id}/tasks`).set(auth).send({ title: `task ${i}` }).expect(201),
    );

    const list = await request(app.getHttpServer()).get(`/leads/${lead.body.id}/tasks`).set(auth).expect(200);
    expect(list.body).toHaveLength(100);
    expect(list.headers['x-total-count']).toBe('101');
  }, 120_000);

  it('creates a task on a lead and lists it', async () => {
    const token = await login('sara@marinabay.test');
    const leadId = stableId('lead', 'karim');

    const created = await request(app.getHttpServer())
      .post(`/leads/${leadId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Call Karim', dueAt: '2030-01-02T10:00:00+04:00' })
      .expect(201);
    expect(created.body).toMatchObject({ leadId, title: 'Call Karim', status: 'open', dueAt: '2030-01-02T06:00:00.000Z' });

    const list = await request(app.getHttpServer())
      .get(`/leads/${leadId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.map((task: { id: string }) => task.id)).toContain(created.body.id);
  });
});
