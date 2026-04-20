-- =============================================================================
-- Finanzas_category_memory — personalised few-shot memory for AI categorisation
-- =============================================================================
-- Every time the user re-categorises a transaction, the normalised description
-- pattern + chosen category is upserted here. On the next import:
--   1. Exact-match patterns skip Gemini entirely (instant, confidence=1).
--   2. Top-N recent entries are injected into Gemini's system prompt as
--      few-shot examples, so the model learns personal conventions.
-- No ML training needed — this is deterministic, cheap, and user-editable.
--
-- Run this via Supabase SQL Editor or:
--   supabase db push
-- =============================================================================

CREATE TABLE IF NOT EXISTS public."Finanzas_category_memory" (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description_pattern text NOT NULL,
  category           text NOT NULL,
  type               text NOT NULL CHECK (type IN ('income', 'expense')),
  hits               integer NOT NULL DEFAULT 1,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, description_pattern)
);

CREATE INDEX IF NOT EXISTS finanzas_category_memory_user_updated_idx
  ON public."Finanzas_category_memory" (user_id, updated_at DESC);

ALTER TABLE public."Finanzas_category_memory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_select_own"  ON public."Finanzas_category_memory";
DROP POLICY IF EXISTS "memory_insert_own"  ON public."Finanzas_category_memory";
DROP POLICY IF EXISTS "memory_update_own"  ON public."Finanzas_category_memory";
DROP POLICY IF EXISTS "memory_delete_own"  ON public."Finanzas_category_memory";

CREATE POLICY "memory_select_own"
  ON public."Finanzas_category_memory" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "memory_insert_own"
  ON public."Finanzas_category_memory" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memory_update_own"
  ON public."Finanzas_category_memory" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "memory_delete_own"
  ON public."Finanzas_category_memory" FOR DELETE
  USING (auth.uid() = user_id);
