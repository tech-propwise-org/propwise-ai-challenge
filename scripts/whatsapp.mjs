#!/usr/bin/env node
// Sends one fake WhatsApp message to the API's webhook, the way the provider would.
//
//   pnpm whatsapp --from "+971 50 246 8135" --text "Hi, any 2-beds in JLT?"
//   pnpm whatsapp --from "+971 50 246 8135" --text "..." --id wamid.123   (the same --id again = a redelivery)
//
// Options: --name (profile name), --to (default: Marina Bay Realty's number), --at (ISO time, default now),
// --api (default http://localhost:3001). The token comes from WHATSAPP_WEBHOOK_TOKEN or api/.env.

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    from: { type: 'string' },
    text: { type: 'string' },
    name: { type: 'string' },
    id: { type: 'string' },
    to: { type: 'string', default: '+971 4 555 0101' },
    at: { type: 'string' },
    api: { type: 'string', default: 'http://localhost:3001' },
  },
});

if (!values.from || !values.text) {
  console.error('Usage: pnpm whatsapp --from "+971 50 246 8135" --text "Hi, any 2-beds in JLT?" [--id wamid.1] [--name Hala]');
  process.exit(2);
}

function tokenFromEnvFile() {
  const envFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'api', '.env');
  try {
    const line = readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('WHATSAPP_WEBHOOK_TOKEN='));
    return line?.slice('WHATSAPP_WEBHOOK_TOKEN='.length).trim();
  } catch {
    return undefined;
  }
}

const token = process.env.WHATSAPP_WEBHOOK_TOKEN ?? tokenFromEnvFile();
if (!token) {
  console.error('No WHATSAPP_WEBHOOK_TOKEN: set it, or copy it from api/.env.example into api/.env.');
  process.exit(2);
}

const body = {
  messageId: values.id ?? `wamid.${randomUUID()}`,
  from: values.from,
  to: values.to,
  text: values.text,
  timestamp: values.at ?? new Date().toISOString(),
  ...(values.name ? { profileName: values.name } : {}),
};

const response = await fetch(`${values.api.replace(/\/$/, '')}/webhooks/whatsapp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Webhook-Token': token },
  body: JSON.stringify(body),
});
console.log(`${response.status} ${await response.text()}`);
console.log(`messageId: ${body.messageId}`);
process.exit(response.ok ? 0 : 1);
