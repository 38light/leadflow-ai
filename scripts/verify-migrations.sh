#!/usr/bin/env bash
# Verify every application migration in a new, disposable database in LOCAL
# Supabase's Postgres container. Never resets or migrates the project's database.
# The small auth/storage scaffold models Supabase-managed migration prerequisites;
# this verifies application SQL, not hosted Auth/Storage service behavior.
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
verify_container="${MIGRATION_VERIFY_CONTAINER:-supabase_db_Lead_to_Customer}"
if [[ ! "$verify_container" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]]; then
  echo 'Invalid local container name.' >&2
  exit 1
fi
# Refuse remote Docker contexts/hosts. This tool is intentionally local-only.
if [[ -n "${DOCKER_CONTEXT:-}" ]]; then
  # Docker gives DOCKER_CONTEXT precedence over DOCKER_HOST.
  verify_endpoint="$(docker context inspect "$DOCKER_CONTEXT" --format '{{.Endpoints.docker.Host}}')"
elif [[ -n "${DOCKER_HOST:-}" ]]; then
  verify_endpoint="$DOCKER_HOST"
else
  verify_context="$(docker context show)"
  verify_endpoint="$(docker context inspect "$verify_context" --format '{{.Endpoints.docker.Host}}')"
fi
if [[ "$verify_endpoint" != unix://* ]]; then
  echo 'Refusing to run: verification requires a local Unix-socket Docker endpoint.' >&2
  exit 1
fi

verify_database="leadflow_verify_$(date +%s)_$$"
verify_created=0
cleanup() {
  local original_status=$?
  trap - EXIT
  if [[ "$verify_created" == 1 ]]; then
    if ! docker exec "$verify_container" dropdb -U postgres --force "$verify_database"; then
      echo "Could not remove disposable database $verify_database. Remove it manually." >&2
      exit 1
    fi
  fi
  exit "$original_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Supabase creates these cluster roles. Do not create or modify shared roles.
verify_roles="$(docker exec "$verify_container" psql -X -U postgres -d postgres -Atc "SELECT count(*) FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role');")"
if [[ "$verify_roles" != 3 ]]; then
  echo 'Expected a local Supabase Postgres container with its managed roles.' >&2
  exit 1
fi

docker exec "$verify_container" createdb -U postgres --template=template0 "$verify_database"
verify_created=1
# Only this generated database is modified below.
docker exec "$verify_container" psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q -c "ALTER DATABASE \"$verify_database\" SET search_path = public, extensions;"

docker exec -i "$verify_container" psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE SCHEMA auth;
CREATE SCHEMA storage;
CREATE SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
  $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid,
  owner_id text,
  metadata jsonb DEFAULT '{}'
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
  $$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
CREATE PUBLICATION supabase_realtime;
SQL

verify_count=0
for migration in "$project_root"/supabase/migrations/*.sql; do
  echo "Checking $(basename "$migration")"
  docker exec -i -e 'PGOPTIONS=-c client_min_messages=warning' "$verify_container" \
    psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q < "$migration"
  verify_count=$((verify_count + 1))
done

docker exec -i "$verify_container" psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'knowledge-docs' AND public = false) THEN
    RAISE EXCEPTION 'Private knowledge-docs bucket is missing';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'Knowledge owners%') <> 4 THEN
    RAISE EXCEPTION 'Knowledge file CRUD policies are incomplete';
  END IF;
  IF (SELECT count(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
      AND tablename IN ('messages', 'notifications', 'contacts', 'bookings')) <> 4 THEN
    RAISE EXCEPTION 'Realtime publication membership is incomplete';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.follow_ups'::regclass
      AND conname = 'follow_ups_assigned_to_fkey' AND condeferrable AND condeferred) THEN
    RAISE EXCEPTION 'Follow-up assignment constraint must be deferred';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = 'private.rate_limit_buckets'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'Rate-limit counters must have RLS enabled';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'private' AND tablename = 'rate_limit_buckets') THEN
    RAISE EXCEPTION 'Rate-limit counters must not have client policies';
  END IF;
END $$;

-- Prove the storage boundary under the actual authenticated role. These fixtures
-- exist only inside this disposable database and are rolled back afterward.
BEGIN;
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-4111-8111-111111111111', 'owner-one@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'owner-two@example.invalid');
INSERT INTO public.knowledge_bases (id, user_id, name) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'First owner base'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Second owner base');
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('knowledge-docs', '22222222-2222-4222-8222-222222222222/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/private.txt');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('knowledge-docs', '11111111-1111-4111-8111-111111111111/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/own.txt');
DO $$
DECLARE changed integer;
BEGIN
  IF (SELECT count(*) FROM storage.objects) <> 1 THEN
    RAISE EXCEPTION 'Storage SELECT exposed another owner file';
  END IF;
  BEGIN
    INSERT INTO storage.objects (bucket_id, name) VALUES
      ('knowledge-docs', '22222222-2222-4222-8222-222222222222/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/injected.txt');
    RAISE EXCEPTION 'Storage INSERT accepted another owner path';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO storage.objects (bucket_id, name) VALUES
      ('knowledge-docs', '11111111-1111-4111-8111-111111111111/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/injected.txt');
    RAISE EXCEPTION 'Storage INSERT accepted another owner knowledge base';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE storage.objects SET name = '22222222-2222-4222-8222-222222222222/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/moved.txt';
    RAISE EXCEPTION 'Storage UPDATE allowed moving into another owner path';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  DELETE FROM storage.objects WHERE name LIKE '22222222%';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Storage DELETE affected another owner file'; END IF;
  UPDATE storage.objects SET name = '11111111-1111-4111-8111-111111111111/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/renamed.txt';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Storage UPDATE did not allow owner rename'; END IF;
END $$;
RESET ROLE;
DELETE FROM public.knowledge_bases WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET LOCAL ROLE authenticated;
DO $$
DECLARE changed integer;
BEGIN
  DELETE FROM storage.objects;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Storage owner could not clean up orphan file'; END IF;
END $$;
SET LOCAL ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects) THEN RAISE EXCEPTION 'Anonymous visitor can read private files'; END IF;
END $$;
ROLLBACK;
SQL

# Assert client denials from PostgreSQL's effective privilege checks. Executing
# a revoked function under SET ROLE crashes Supabase's 17.6.1.104 image in the
# supautils permission-hint hook: https://github.com/supabase/supautils/issues/214
# Do not exercise that broken error path on the shared local Postgres instance.
docker exec -i "$verify_container" psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
DECLARE client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF has_function_privilege(client_role, 'public.consume_public_rate_limit(text,integer,integer)', 'EXECUTE') THEN
      RAISE EXCEPTION 'Client role % can execute the rate-limit RPC', client_role;
    END IF;
    IF has_schema_privilege(client_role, 'private', 'USAGE')
        OR has_table_privilege(client_role, 'private.rate_limit_buckets', 'SELECT,INSERT,UPDATE,DELETE') THEN
      RAISE EXCEPTION 'Client role % has access to private rate-limit counters', client_role;
    END IF;
  END LOOP;
  IF NOT has_function_privilege('service_role', 'public.consume_public_rate_limit(text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Service role cannot execute the rate-limit RPC';
  END IF;
END $$;
SQL

# Expected validation errors are raised inside a function the service role may
# execute, so they do not enter the extension's broken EXECUTE-denial path.
verify_rate_rejection() {
  local verify_error_output
  if verify_error_output="$(docker exec -i "$verify_container" psql -X -U postgres -d "$verify_database" \
    -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -q -v test_role="$1" -v test_claim="$2" -v test_sql="$3" 2>&1 <<'SQL'
SET ROLE :"test_role";
SET request.jwt.claim.role = :'test_claim';
:test_sql
SQL
  )"; then
    echo 'Rate-limit operation unexpectedly succeeded.' >&2
    return 1
  elif [[ "$verify_error_output" != *"ERROR:  $4:"* ]]; then
    echo "Rate-limit operation failed with an unexpected error: $verify_error_output" >&2
    return 1
  fi
}
verify_rate_rejection service_role authenticated \
  "SELECT public.consume_public_rate_limit(repeat('a', 64), 3, 60);" 42501
for verify_invalid_args in \
  'NULL, 3, 60' "'192.0.2.1', 3, 60" \
  "repeat('d', 64), NULL, 60" "repeat('d', 64), 0, 60" "repeat('d', 64), 100001, 60" \
  "repeat('d', 64), 3, NULL" "repeat('d', 64), 3, 0" "repeat('d', 64), 3, 86401"; do
  verify_rate_rejection service_role service_role \
    "SELECT public.consume_public_rate_limit($verify_invalid_args);" P0001
done

docker exec -i "$verify_container" psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q <<'SQL'
BEGIN;
SET LOCAL ROLE service_role;
SET LOCAL request.jwt.claim.role = 'service_role';
DO $$
DECLARE
  response jsonb;
  first_reset numeric;
  request_number integer;
BEGIN
  FOR request_number IN 1..5 LOOP
    response := public.consume_public_rate_limit(repeat('a', 64), 3, 60);
    IF (response->>'allowed')::boolean IS DISTINCT FROM (request_number <= 3)
        OR (response->>'remaining')::integer IS DISTINCT FROM greatest(0, 3 - request_number) THEN
      RAISE EXCEPTION 'Incorrect rate-limit decision for request %: %', request_number, response;
    END IF;
    IF request_number = 1 THEN first_reset := (response->>'reset')::numeric; END IF;
    IF (response->>'reset')::numeric IS DISTINCT FROM first_reset
        OR first_reset < extract(epoch FROM clock_timestamp()) THEN
      RAISE EXCEPTION 'Rate-limit reset changed within the active window';
    END IF;
  END LOOP;
END $$;
RESET ROLE;
-- Advance only this fixture's expiry; no real-time sleep or application DB edits.
UPDATE private.rate_limit_buckets SET expires_at = clock_timestamp() - interval '1 second'
WHERE key_hash = repeat('a', 64);
SET LOCAL ROLE service_role;
DO $$
DECLARE response jsonb;
BEGIN
  response := public.consume_public_rate_limit(repeat('a', 64), 3, 60);
  IF (response->>'allowed')::boolean IS DISTINCT FROM true
      OR (response->>'remaining')::integer IS DISTINCT FROM 2
      OR (response->>'reset')::numeric <= extract(epoch FROM clock_timestamp()) THEN
    RAISE EXCEPTION 'Expired rate-limit window did not reset: %', response;
  END IF;
END $$;
RESET ROLE;
DO $$
BEGIN
  IF (SELECT hits FROM private.rate_limit_buckets WHERE key_hash = repeat('a', 64)) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Expired rate-limit counter did not reset to one';
  END IF;
END $$;
ROLLBACK;

-- A scratch-only results table captures every decision from separate sessions.
CREATE TABLE public.migration_verification_rate_results (allowed boolean NOT NULL, remaining integer NOT NULL);
REVOKE ALL ON public.migration_verification_rate_results FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.migration_verification_rate_results TO service_role;
SQL

verify_concurrent_request() {
  docker exec -i "$verify_container" psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q <<'SQL'
SET ROLE service_role;
SET request.jwt.claim.role = 'service_role';
WITH response AS MATERIALIZED (
  SELECT public.consume_public_rate_limit(repeat('c', 64), 5, 3600) AS result
)
INSERT INTO public.migration_verification_rate_results (allowed, remaining)
SELECT (result->>'allowed')::boolean, (result->>'remaining')::integer FROM response;
SQL
}
verify_request_pids=()
for ((verify_request=0; verify_request<20; verify_request++)); do
  verify_concurrent_request &
  verify_request_pids+=("$!")
done
verify_concurrency_failed=0
for verify_request_pid in "${verify_request_pids[@]}"; do
  if ! wait "$verify_request_pid"; then verify_concurrency_failed=1; fi
done
if [[ "$verify_concurrency_failed" == 1 ]]; then
  echo 'One or more concurrent rate-limit requests failed.' >&2
  exit 1
fi
docker exec -i "$verify_container" psql -X -U postgres -d "$verify_database" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
BEGIN
  IF (SELECT count(*) FROM public.migration_verification_rate_results) <> 20
      OR (SELECT count(*) FROM public.migration_verification_rate_results WHERE allowed) <> 5
      OR (SELECT count(*) FROM public.migration_verification_rate_results WHERE NOT allowed AND remaining = 0) <> 15
      OR (SELECT sum(remaining) FROM public.migration_verification_rate_results WHERE allowed) <> 10 THEN
    RAISE EXCEPTION 'Concurrent rate limiting did not allow exactly five of twenty requests';
  END IF;
  IF (SELECT hits FROM private.rate_limit_buckets WHERE key_hash = repeat('c', 64)) IS DISTINCT FROM 6 THEN
    RAISE EXCEPTION 'Concurrent rate-limit counter was not atomically capped at limit + 1';
  END IF;
END $$;
SQL

echo "Passed: $verify_count migrations, bootstrap/storage isolation, and rate-limit permissions, expiry, validation, and 20 concurrent requests. Disposable database will be removed."
