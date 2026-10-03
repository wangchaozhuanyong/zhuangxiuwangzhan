import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_SITE_CSP_POLICY, SITE_CSP_POLICY, buildLocalSiteCspPolicy } from './site-csp.mjs';

test('configured loopback API uses only its exact origin and websocket peer', () => {
  for (const origin of ['http://127.0.0.1:56221', 'http://localhost:56221', 'http://[::1]:56221']) {
    const policy = buildLocalSiteCspPolicy(origin);
    const connection = policy.split('; ').find(item => item.startsWith('connect-src '));
    assert.ok(connection.includes(origin));
    assert.ok(connection.includes(origin.replace(/^http/, 'ws')));
    assert.ok(policy.split('; ').find(item => item.startsWith('img-src ')).includes(origin));
    assert.ok(policy.split('; ').find(item => item.startsWith('media-src ')).includes(origin));
    assert.ok(!policy.includes('localhost:*'));
    assert.ok(!policy.includes('127.0.0.1:*'));
  }
});

test('missing, remote, credentialed and malformed addresses grant no local access', () => {
  for (const address of [undefined, '', 'invalid', 'https://foreign.example', 'http://127.0.0.1.attacker.example:56221', 'ftp://127.0.0.1:56221', 'http://user:pass@127.0.0.1:56221', 'http://127.0.0.1:56221?secret=x', 'http://127.0.0.1:56221#secret']) {
    assert.equal(buildLocalSiteCspPolicy(address), LOCAL_SITE_CSP_POLICY);
  }
});

test('loopback allowances never change production policy', () => {
  const before = SITE_CSP_POLICY;
  buildLocalSiteCspPolicy('http://127.0.0.1:56221');
  assert.equal(SITE_CSP_POLICY, before);
  assert.ok(!SITE_CSP_POLICY.includes('127.0.0.1'));
  assert.ok(!SITE_CSP_POLICY.includes('localhost'));
  assert.ok(!SITE_CSP_POLICY.includes("'unsafe-eval'"));
  assert.ok(SITE_CSP_POLICY.endsWith('upgrade-insecure-requests'));
});
