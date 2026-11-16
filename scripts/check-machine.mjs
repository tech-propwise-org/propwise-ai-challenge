#!/usr/bin/env node
// Checks that this computer can run the Propwise assessment. Needs only Node.
// Run it a few days before the assessment:  node check-machine.mjs

import { spawnSync } from 'node:child_process';
import { connect, createServer } from 'node:net';

const results = [];

function record(ok, name, detail) {
  results.push({ ok, name, detail });
  console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'NOTE'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function run(command) {
  const result = spawnSync(command, { shell: true, encoding: 'utf8', timeout: 120_000 });
  return { ok: result.status === 0, out: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

function majorOf(version) {
  return Number(String(version).replace(/^v/, '').split('.')[0]);
}

/** The range every installed package supports (Metro 0.87 skips Node 25): ^22.13.0 || ^24.3.0 || >=26. */
function nodeSupported(version) {
  const [major, minor, patch] = String(version).replace(/^v/, '').split('.').map(Number);
  const atLeast = (m, p) => minor > m || (minor === m && patch >= p);
  if (major === 22) return atLeast(13, 0);
  if (major === 24) return atLeast(3, 0);
  return major >= 26;
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port);
  });
}

function somethingAnswers(port, host) {
  return new Promise((resolve) => {
    const socket = connect({ port, host, timeout: 1000 });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

// Docker Desktop on Windows can hold a port on IPv6 only, so a bind test alone says "free". Try connecting too.
async function portFree(port) {
  const [listens, v4, v6] = await Promise.all([
    canListen(port),
    somethingAnswers(port, '127.0.0.1'),
    somethingAnswers(port, '::1'),
  ]);
  return listens && !v4 && !v6;
}

console.log('Checking this machine for the Propwise assessment…\n');

record(
  nodeSupported(process.version),
  'Node.js 22.13+, 24.3+ or 26+ (not 23 or 25)',
  nodeSupported(process.version)
    ? process.version
    : `${process.version} isn't supported by React Native and the test tools: install Node 24 (24.3 or newer) or 22 (22.13 or newer)`,
);

const pnpm = run('pnpm --version');
record(pnpm.ok && majorOf(pnpm.out) >= 10, 'pnpm 10 or newer', pnpm.ok ? pnpm.out : 'not found: run `corepack enable` or `npm i -g pnpm@10`');

const git = run('git --version');
record(git.ok, 'git', git.ok ? git.out : 'not found');

const docker = run('docker info --format "{{.ServerVersion}}"');
record(docker.ok, 'Docker running', docker.ok ? `server ${docker.out}` : 'Docker is not installed or not running');

const compose = run('docker compose version --short');
record(compose.ok, 'Docker Compose v2', compose.ok ? compose.out : 'not found');

if (docker.ok) {
  console.log('      Downloading the Postgres image now so it is ready on the day (can take a minute)…');
  const pull = run('docker pull postgres:16-alpine');
  record(pull.ok, 'Postgres image downloaded', pull.ok ? 'postgres:16-alpine' : pull.out.split('\n').slice(-1)[0]);
}

for (const [port, use] of [
  [3000, 'web app'],
  [3001, 'API'],
  [5442, 'database'],
  [8081, 'Expo'],
]) {
  record(await portFree(port), `Port ${port} free (${use})`);
}

const claude = run('claude --version');
record(claude.ok ? true : null, 'Claude Code', claude.ok ? claude.out : 'not found (fine if you use another AI tool)');

const simulator = process.platform === 'darwin' && run('xcrun simctl help').ok;
record(
  null,
  'Mobile',
  `Install Expo Go on your phone, or have an iOS Simulator or Android emulator ready.${simulator ? ' iOS Simulator found.' : ''}`,
);
record(
  null,
  'Expo Go on an iPhone',
  'needs a free Expo account: sign in inside Expo Go and run `npx expo login` on this computer. Android, simulators and emulators do not.',
);

const failed = results.filter((result) => result.ok === false);
console.log(
  failed.length === 0
    ? '\nAll required checks passed. See you on the day.'
    : `\n${failed.length} check(s) failed. Please fix them before the assessment, or tell us so we can prepare a spare laptop.`,
);
process.exit(failed.length === 0 ? 0 : 1);
