-- Durable abuse counters: only the server service role may consume them.
-- Store hashes, never raw IPs, visitor tokens, or customer content.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE private.rate_limit_buckets (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[a-f0-9]{64}$'),
  hits integer NOT NULL CHECK (hits > 0),
  expires_at timestamptz NOT NULL
);
ALTER TABLE private.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.rate_limit_buckets FROM PUBLIC, anon, authenticated;
-- No client policies: these server-owned counters have no client access.
CREATE INDEX rate_limit_buckets_expiry_idx ON private.rate_limit_buckets(expires_at);

CREATE FUNCTION public.consume_public_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_hits integer;
  v_expires timestamptz;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_key_hash IS NULL OR p_key_hash !~ '^[a-f0-9]{64}$'
    OR p_limit IS NULL OR p_limit < 1 OR p_limit > 100000
    OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit';
  END IF;
  INSERT INTO private.rate_limit_buckets AS bucket (key_hash, hits, expires_at)
  VALUES (p_key_hash, 1, v_now + make_interval(secs => p_window_seconds))
  ON CONFLICT (key_hash) DO UPDATE SET
    hits = CASE WHEN bucket.expires_at <= v_now THEN 1 ELSE least(bucket.hits + 1, p_limit + 1) END,
    expires_at = CASE WHEN bucket.expires_at <= v_now THEN excluded.expires_at ELSE bucket.expires_at END
  RETURNING hits, expires_at INTO v_hits, v_expires;
  DELETE FROM private.rate_limit_buckets WHERE key_hash IN (
    SELECT key_hash FROM private.rate_limit_buckets WHERE expires_at < v_now - interval '1 day'
    ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
  );
  RETURN jsonb_build_object('allowed', v_hits <= p_limit, 'remaining', greatest(0, p_limit-v_hits),
    'reset', ceil(extract(epoch FROM v_expires)));
END;
$$;
REVOKE ALL ON FUNCTION public.consume_public_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_rate_limit(text, integer, integer) TO service_role;
