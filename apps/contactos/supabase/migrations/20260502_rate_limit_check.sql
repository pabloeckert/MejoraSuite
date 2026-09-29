-- Atomic rate limit check: count + insert + cleanup in a single call.
-- Replaces 3 separate REST queries with 1 function invocation.
-- Returns: { allowed, current_count, retry_after_sec }

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip TEXT,
  p_window_sec INT DEFAULT 60,
  p_max_requests INT DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
  v_oldest TIMESTAMPTZ;
  v_retry_after INT;
BEGIN
  v_window_start := NOW() - (p_window_sec || ' seconds')::INTERVAL;

  -- Count entries in current window (uses idx_rate_limits_ip_timestamp)
  SELECT COUNT(*) INTO v_count
  FROM rate_limits
  WHERE ip = p_ip AND timestamp >= v_window_start;

  -- Insert new entry (always, for accurate tracking)
  INSERT INTO rate_limits (ip, timestamp) VALUES (p_ip, NOW());

  -- Cleanup old entries (>5 min) — amortized, ~1% equivalent
  -- Runs inside the same transaction, no extra roundtrip
  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE timestamp < NOW() - INTERVAL '5 minutes';
  END IF;

  -- Check limit
  IF v_count >= p_max_requests THEN
    -- Get oldest entry for retry-after calculation
    SELECT timestamp INTO v_oldest
    FROM rate_limits
    WHERE ip = p_ip AND timestamp >= v_window_start
    ORDER BY timestamp ASC
    LIMIT 1;

    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_oldest + (p_window_sec || ' seconds')::INTERVAL - NOW()))));
    RETURN json_build_object('allowed', false, 'current_count', v_count, 'retry_after_sec', v_retry_after);
  END IF;

  RETURN json_build_object('allowed', true, 'current_count', v_count + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Composite index for the rate limit check (covers ip + timestamp range scan)
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_timestamp
  ON rate_limits (ip, timestamp DESC);
