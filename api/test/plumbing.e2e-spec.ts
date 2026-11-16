import { EntityManager } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { stableId } from '../src/db/stable-id';

const TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN!;

describe('WhatsApp webhook, team, agency budget and market data (against the test database)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    if (!TOKEN) throw new Error('WHATSAPP_WEBHOOK_TOKEN is not set. Copy it from api/.env.example to api/.env.');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function auth(email: string) {
    const response = await http().post('/auth/login').send({ email, password: 'challenge123' }).expect(200);
    return { Authorization: `Bearer ${response.body.accessToken}` };
  }

  function whatsapp(body: Record<string, unknown>, token: string | null = TOKEN) {
    const call = http().post('/webhooks/whatsapp');
    if (token !== null) call.set('X-Webhook-Token', token);
    return call.send({
      messageId: `wamid.${Math.random().toString(36).slice(2)}`,
      to: '+971 4 555 0101',
      timestamp: new Date().toISOString(),
      ...body,
    });
  }

  it('refuses a webhook call without the right token', async () => {
    await whatsapp({ from: '+971 50 000 0001', text: 'hi' }, null).expect(401);
    await whatsapp({ from: '+971 50 000 0001', text: 'hi' }, 'wrong').expect(401);
  });

  it('saves a message from a new number on a new, unassigned lead of the agency the number belongs to', async () => {
    const received = await whatsapp({ messageId: 'wamid.first', from: '+971 50 000 0002', profileName: 'Zara', text: 'Hi, any 2-beds in JLT?' }).expect(200);
    expect(received.body).toMatchObject({ received: true });

    const lead = await http().get(`/leads/${received.body.leadId}`).set(await auth('sara@marinabay.test')).expect(200);
    expect(lead.body).toMatchObject({ name: 'Zara', phone: '+971 50 000 0002', source: 'whatsapp', status: 'new', assignedAgent: null });
    expect(lead.body.messages).toEqual([
      expect.objectContaining({ direction: 'inbound', channel: 'whatsapp', body: 'Hi, any 2-beds in JLT?', externalId: 'wamid.first' }),
    ]);
    await http().get(`/leads/${received.body.leadId}`).set(await auth('omar@desertkey.test')).expect(404);
  });

  it("adds a message from a known number to that lead, whatever the number's spacing", async () => {
    // Noor's number is +971 56 902 1177. (Not Karim: other tests read his latest message.)
    const received = await whatsapp({ from: '971569021177', text: 'Any news on the Palm 3-beds?' }).expect(200);
    expect(received.body.leadId).toBe(stableId('lead', 'noor'));
  });

  it("answers 404 for a number that is no agency's, and 400 for a bad body", async () => {
    await whatsapp({ from: '+971 50 000 0003', text: 'hi', to: '+1 555 0100' }).expect(404);
    await whatsapp({ from: '+971 50 000 0003', text: '', timestamp: 'yesterday' }).expect(400);
    // A sender with no digits would otherwise match the agency's leads that have no phone at all.
    await whatsapp({ from: 'abc', text: 'hi' }).expect(400);
    await whatsapp({ from: '+12 3', text: 'hi' }).expect(400);
  });

  /** Counted straight from the database, so other test files that assign leads first don't matter. */
  async function openLeadsOf(agentKey: string): Promise<number> {
    const [row] = await app.get(EntityManager).fork().execute<{ open: number }[]>(
      `select count(*)::int as open from leads where assigned_agent_id = ? and status not in ('won', 'lost')`,
      [stableId('agent', agentKey)],
    );
    return row.open;
  }

  it("lists the agency's agents with their areas, languages, leave and open leads", async () => {
    const response = await http().get('/agents').set(await auth('sara@marinabay.test')).expect(200);
    const byName = new Map(response.body.map((agent: { name: string }) => [agent.name, agent]));
    expect(byName.get('Khalid Haddad')).toMatchObject({ languages: ['ar', 'en'], onLeave: false, openLeads: await openLeadsOf('khalid') });
    expect(byName.get('Layla Farouk')).toMatchObject({ onLeave: true, openLeads: await openLeadsOf('layla') });
    expect(byName.get('Sara Khan')).toMatchObject({ openLeads: await openLeadsOf('sara') });
    // Emma's lead is "won": it is Khalid's, but not open.
    expect(await openLeadsOf('khalid')).toBeGreaterThanOrEqual(1);
    expect(byName.has('Omar Nasser')).toBe(false);
  });

  it('puts an agent on leave, only within the agency', async () => {
    const sara = await auth('sara@marinabay.test');
    const mariam = stableId('agent', 'mariam');
    const updated = await http().patch(`/agents/${mariam}`).set(sara).send({ onLeave: true }).expect(200);
    expect(updated.body).toMatchObject({ id: mariam, onLeave: true });
    await http().patch(`/agents/${mariam}`).set(sara).send({ onLeave: false }).expect(200);
    await http().patch(`/agents/${stableId('agent', 'omar')}`).set(sara).send({ onLeave: true }).expect(404);
    await http().patch(`/agents/${mariam}`).set(sara).send({ languages: ['fr'] }).expect(400);
  });

  it("reads and sets the agency's AI budget", async () => {
    const omar = await auth('omar@desertkey.test');
    const [stored] = await app.get(EntityManager).fork().execute<{ budget: string; spent: string }[]>(
      `select ai_monthly_budget_usd as budget, ai_spent_usd as spent from agencies where id = ?`,
      [stableId('agency', 'desert-key')],
    );
    expect((await http().get('/agency').set(omar).expect(200)).body).toMatchObject({
      name: 'Desert Key Properties',
      aiMonthlyBudgetUsd: Number(stored.budget),
      aiSpentUsd: Number(stored.spent),
    });
    const updated = await http().patch('/agency').set(omar).send({ aiMonthlyBudgetUsd: 12.25 }).expect(200);
    expect(updated.body).toMatchObject({ aiMonthlyBudgetUsd: 12.25 });
    await http().patch('/agency').set(omar).send({ aiMonthlyBudgetUsd: -1 }).expect(400);
    const sara = await auth('sara@marinabay.test');
    expect((await http().get('/agency').set(sara).expect(200)).body.aiMonthlyBudgetUsd).toBe(50);
  });

  it("marks a listing sold, only the agency's own", async () => {
    const sara = await auth('sara@marinabay.test');
    const id = stableId('property', 'MBR-1021');
    expect((await http().patch(`/properties/${id}`).set(sara).send({ status: 'sold' }).expect(200)).body.status).toBe('sold');
    await http().patch(`/properties/${id}`).set(sara).send({ status: 'available' }).expect(200);
    await http().patch(`/properties/${stableId('property', 'DKP-2001')}`).set(sara).send({ status: 'sold' }).expect(404);
    await http().patch(`/properties/${id}`).set(sara).send({ status: 'gone' }).expect(400);
  });

  it('searches recorded sales by area, type, bedrooms and date, newest first', async () => {
    const sara = await auth('sara@marinabay.test');
    const all = await http().get('/market/sales?area=business%20bay&type=apartment&bedrooms=2').set(sara).expect(200);
    expect(all.body.total).toBeGreaterThan(0);
    expect(all.body.items.every((s: { area: string; type: string; bedrooms: number }) => s.area === 'Business Bay' && s.type === 'apartment' && s.bedrooms === 2)).toBe(true);
    const times = all.body.items.map((s: { soldAt: string }) => Date.parse(s.soldAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const since = new Date(Date.now() - 365 * 86_400_000).toISOString();
    const lastYear = await http().get(`/market/sales?area=Business%20Bay&type=apartment&bedrooms=2&soldAfter=${encodeURIComponent(since)}`).set(sara).expect(200);
    expect(lastYear.body.total).toBeLessThan(all.body.total);
    await http().get('/market/sales').expect(401);
  });
});
