-- Migration: 001_atomic_balance.sql
-- Run this in your Supabase SQL editor to enable truly atomic balance updates.
--
-- Once deployed, replace `adjustAccountBalance` in useDineroActions.ts with:
--
--   await supabase.rpc('adjust_account_balance', {
--     p_account_id: accountId,
--     p_delta: delta,
--   });
--
-- This eliminates the read-then-write race condition in the client-side approach.

CREATE OR REPLACE FUNCTION adjust_account_balance(
  p_account_id uuid,
  p_delta      numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- runs with owner privileges so RLS doesn't block internal ops
AS $$
BEGIN
  UPDATE "Finanzas_accounts"
  SET    balance = balance + p_delta
  WHERE  id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account % not found', p_account_id;
  END IF;
END;
$$;

-- Grant execution to authenticated users only
REVOKE ALL ON FUNCTION adjust_account_balance(uuid, numeric) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION adjust_account_balance(uuid, numeric) TO authenticated;
