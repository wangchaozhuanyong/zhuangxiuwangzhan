import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const project = fileURLToPath(new URL('..', import.meta.url));
const source = fs.readFileSync(path.join(project, 'supabase/functions/content-publish/index.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const databaseRevision = '2026-10-05T01:02:03.123456+00:00';

// Execute the actual Edge handler, mocking transport and external entry services.
// No URL fetch, real environment, credentials, database or authentication is used.
function handlerFixture({ revisionRow = { updated_at: databaseRevision }, revisionError = null, dryRun = false, allowed = true } = {}) {
  let handler;
  const calls = { writes: [], selects: [], publish: 0, purge: 0 };
  const builder = {
    update: (payload) => { calls.writes.push(payload); return builder; },
    eq: (field, value) => { assert.equal(field, 'id'); assert.equal(value, 'default'); return builder; },
    select: (fields) => { calls.selects.push(fields); return builder; },
    maybeSingle: async () => ({ data: revisionRow, error: revisionError }),
    // Preserve await-builder compatibility so the pre-fix handler demonstrably
    // returns its generated clock instead of failing on an absent mock method.
    then: (resolve, reject) => Promise.resolve({ data: revisionRow, error: revisionError }).then(resolve, reject),
  };
  const client = { from: (table) => { assert.equal(table, 'site_settings'); return builder; } };
  const modules = {
    'https://deno.land/std@0.224.0/http/server.ts': { serve: (callback) => { handler = callback; } },
    'https://esm.sh/@supabase/supabase-js@2': { createClient: () => client },
    '../_shared/admin-auth.ts': { getServiceRoleKey: () => 'synthetic-not-a-secret', requireAdminAccess: async () => allowed
      ? { ok: true, mode: 'admin', userId: 'synthetic', role: 'super_admin' }
      : { ok: false, status: 403, error: 'Synthetic denied access' } },
    '../_shared/cors.ts': { corsHeadersFor: () => ({}), handleCorsPreflight: () => new Response(null, { status: 204 }), isAllowedCorsOrigin: () => true },
    '../_shared/request-body.ts': { BodyTooLargeError: class extends Error {}, readJsonBody: async () => ({ contentType: 'cache_invalidation', record: {} }) },
    './cache-invalidation.ts': { purgePublicHtmlCache: async () => { calls.purge++; return { ok: true, attempted: false }; } },
    './github-oidc.ts': {}, './permit-issuer.ts': {}, './permit-auth.ts': {},
    './service.ts': { publishContent: async () => { calls.publish++; return { body: { ok: true, dry_run: dryRun, performed_write: !dryRun, saved_id: 'fixture' } }; } },
  };
  vm.runInNewContext(compiled, {
    exports: {}, require: (specifier) => {
      assert.ok(Object.hasOwn(modules, specifier), `Unexpected handler dependency: ${specifier}`);
      return modules[specifier];
    },
    Deno: { env: { get: (name) => name === 'SUPABASE_URL' ? 'http://synthetic.invalid' : undefined } },
    Request, Response, Headers, Date,
  }, { filename: 'content-publish/index.ts' });
  assert.equal(typeof handler, 'function');
  return { calls, run: () => handler(new Request('http://synthetic.invalid/content-publish', { method: 'POST', body: '{}' })) };
}

test('cache revision returns the existing trigger-owned database timestamp without losing microseconds', async () => {
  const fixture = handlerFixture();
  const response = await fixture.run(); const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.cache_invalidation.ok, true);
  assert.equal(body.cache_invalidation.revision, databaseRevision);
  assert.equal(fixture.calls.writes.length, 1);
  assert.notEqual(fixture.calls.writes[0].updated_at, databaseRevision);
  assert.deepEqual(fixture.calls.selects, ['updated_at']);
  assert.equal(fixture.calls.publish, 1); assert.equal(fixture.calls.purge, 1);
});

test('a successful zero-row revision update preserves the content save and requests delivery recovery', async () => {
  const fixture = handlerFixture({ revisionRow: null }); const body = await (await fixture.run()).json();
  assert.equal(body.ok, true); assert.equal(body.performed_write, true); assert.equal(body.saved_id, 'fixture');
  assert.equal(body.cache_invalidation.ok, false); assert.equal(body.cache_invalidation.revision, null);
  assert.match(body.warnings.join(' '), /revision was not returned/);
});

test('revision transport failure is not claimed as cache delivery success', async () => {
  const fixture = handlerFixture({ revisionRow: null, revisionError: { message: 'Synthetic revision failure' } });
  const body = await (await fixture.run()).json();
  assert.equal(body.ok, true); assert.equal(body.cache_invalidation.ok, false); assert.equal(body.cache_invalidation.revision, null);
  assert.match(body.warnings.join(' '), /Synthetic revision failure/);
});

test('dry-run retains the existing no-write behavior', async () => {
  const fixture = handlerFixture({ dryRun: true }); const body = await (await fixture.run()).json();
  assert.equal(body.dry_run, true); assert.equal(body.performed_write, false);
  assert.equal(body.cache_invalidation, undefined); assert.equal(fixture.calls.writes.length, 0); assert.equal(fixture.calls.purge, 0);
});

test('denied access still returns before publishing or touching the revision', async () => {
  const fixture = handlerFixture({ allowed: false }); const response = await fixture.run();
  assert.equal(response.status, 403); assert.equal(fixture.calls.publish, 0); assert.equal(fixture.calls.writes.length, 0);
});
