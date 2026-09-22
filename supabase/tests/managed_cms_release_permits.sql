-- Run in an isolated PostgreSQL test database after the permit migration.
begin;

do $$
declare
  p_id uuid := '11111111-1111-4111-8111-111111111111';
  p_other uuid := '22222222-2222-4222-8222-222222222222';
  p_expired uuid := '33333333-3333-4333-8333-333333333333';
  p_record uuid := 'b401a610-a4dc-4a0b-a7e0-efcac6c81d71';
  p_timestamp timestamptz := '2026-08-30T10:55:12.151465+00:00';
  p_hash text := repeat('a', 64);
  result public.managed_cms_release_permits;
begin
  if pg_catalog.has_function_privilege('anon', 'public.claim_managed_cms_release_permit(uuid,text,text,text,text,text,text,uuid,text,timestamptz,text,bigint,text,text,bigint,bigint,integer)', 'EXECUTE') then
    raise exception 'anon must not claim permits';
  end if;

  insert into public.managed_cms_release_permits (
    permit_id, task_id, action_id, action_class, operation, scope, candidate_version,
    record_id, slug, expected_updated_at, payload_sha256, rollback_payload_sha256, github_repository_id,
    github_workflow_ref, github_workflow_sha, github_actor_id, github_run_id, github_run_attempt,
    qa_receipt_id, operations_decision_id, policy_decision_id, issuer_evidence_sha256, expires_at
  ) values (
    p_id, 'fc-20260920-builtin-whole-house-custom-v1', 'publish-builtin-whole-house-custom-v1',
    'cms_write', 'publish', 'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, repeat('d',64), 1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main',
    repeat('c', 40), 98765, null, null, 'qa-real', 'operations-real', 'policy-real', repeat('b', 64), now() + interval '10 minutes'
  );

  select * into result from public.claim_managed_cms_release_permit(
    p_id, 'wrong-task', 'publish-builtin-whole-house-custom-v1', 'cms_write', 'publish',
    'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, 1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main', repeat('c',40), 98765, 12345, 1
  );
  if found then raise exception 'cross-task claim was accepted'; end if;

  select * into result from public.claim_managed_cms_release_permit(
    p_id, 'fc-20260920-builtin-whole-house-custom-v1', 'publish-builtin-whole-house-custom-v1',
    'cms_write', 'publish', 'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, 1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main', repeat('c',40), 98765, 12345, 1
  );
  if not found or result.status <> 'claimed' then raise exception 'exact claim failed'; end if;

  select * into result from public.claim_managed_cms_release_permit(
    p_id, 'fc-20260920-builtin-whole-house-custom-v1', 'publish-builtin-whole-house-custom-v1',
    'cms_write', 'publish', 'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, 1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main', repeat('c',40), 98765, 12345, 1
  );
  if found then raise exception 'replayed claim was accepted'; end if;

  select * into result from public.begin_managed_cms_release_write(p_id, 12345, 1);
  if not found or result.status <> 'writing' then raise exception 'first write transition failed'; end if;
  select * into result from public.begin_managed_cms_release_write(p_id, 12345, 1);
  if found then raise exception 'second write transition was accepted'; end if;

  select * into result from public.finish_managed_cms_release_write(p_id, 12345, 1, null, null, false);
  if not found or result.status <> 'uncertain' then raise exception 'uncertain state not recorded'; end if;
  select * into result from public.begin_managed_cms_release_write(p_id, 12345, 1);
  if found then raise exception 'uncertain write retried'; end if;
  select * into result from public.revoke_managed_cms_release_permit(p_id);
  if found then raise exception 'uncertain result was revoked to bypass reconciliation'; end if;

  insert into public.managed_cms_release_permits (
    permit_id, task_id, action_id, action_class, operation, scope, candidate_version,
    record_id, slug, expected_updated_at, payload_sha256, rollback_payload_sha256,
    github_repository_id, github_workflow_ref, github_workflow_sha, github_actor_id,
    qa_receipt_id, operations_decision_id, policy_decision_id, issuer_evidence_sha256, expires_at
  ) values (
    p_other, 'fc-20260920-builtin-whole-house-custom-v1', 'actor-check', 'cms_write', 'publish',
    'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, repeat('d',64),
    1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main',
    repeat('c',40), 98765, 'qa-real', 'operations-real', 'policy-real', repeat('b',64), now() + interval '10 minutes'
  );
  select * into result from public.claim_managed_cms_release_permit(
    p_other, 'fc-20260920-builtin-whole-house-custom-v1', 'actor-check', 'cms_write', 'publish',
    'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, 1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main',
    repeat('c',40), 55555, 12346, 1
  );
  if found then raise exception 'wrong GitHub actor claimed permit'; end if;
  select * into result from public.claim_managed_cms_release_permit(
    p_other, 'fc-20260920-builtin-whole-house-custom-v1', 'actor-check', 'cms_write', 'publish',
    'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, 1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main',
    repeat('c',40), 98765, 12346, 1
  );
  if not found or result.github_run_id <> 12346 or result.status <> 'claimed' then
    raise exception 'first legitimate run did not bind atomically';
  end if;
  select * into result from public.revoke_managed_cms_release_permit(p_other);
  if not found or result.status <> 'revoked' then raise exception 'pre-write revoke failed'; end if;

  insert into public.managed_cms_release_permits (
    permit_id, task_id, action_id, action_class, operation, scope, candidate_version,
    record_id, slug, expected_updated_at, payload_sha256, rollback_payload_sha256,
    github_repository_id, github_workflow_ref, github_workflow_sha, github_actor_id,
    qa_receipt_id, operations_decision_id, policy_decision_id, issuer_evidence_sha256,
    issued_at, expires_at
  ) values (
    p_expired, 'fc-20260920-builtin-whole-house-custom-v1', 'actor-check', 'cms_write', 'publish',
    'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, repeat('d',64),
    1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main',
    repeat('c',40), 98765, 'qa-real', 'operations-real', 'policy-real', repeat('b',64),
    now() - interval '1 hour', now() - interval '1 minute'
  );
  select * into result from public.claim_managed_cms_release_permit(
    p_expired, 'fc-20260920-builtin-whole-house-custom-v1', 'actor-check', 'cms_write', 'publish',
    'flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71',
    'builtin-whole-house-custom-v1', p_record, 'builtin', p_timestamp, p_hash, 1248188229,
    'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main',
    repeat('c',40), 98765, 12347, 1
  );
  if found then raise exception 'expired permit was claimed'; end if;
end;
$$;

rollback;
