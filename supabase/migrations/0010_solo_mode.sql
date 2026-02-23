-- Solo mode: single-player turn-based runs
-- Fully additive — no changes to existing tables.

CREATE TABLE public.solo_runs (
  id              text PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seed            integer NOT NULL,
  config_key      text NOT NULL DEFAULT 'default',
  week            integer NOT NULL DEFAULT 0,
  cash            bigint NOT NULL,
  expertise       integer NOT NULL DEFAULT 0,
  artworks        jsonb NOT NULL DEFAULT '[]',
  pending_loans   jsonb NOT NULL DEFAULT '[]',
  pending_lots    jsonb NOT NULL DEFAULT '[]',
  quiz            jsonb,
  outcome         text CHECK (outcome IN ('museum', 'bankruptcy', 'timeout')),
  achievement     text CHECK (achievement IN ('museum', 'wing', 'gallery', 'exhibition')),
  museums_founded integer NOT NULL DEFAULT 0,
  total_carry_paid bigint NOT NULL DEFAULT 0,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_solo_runs_user ON public.solo_runs(user_id, created_at DESC);
