-- Add last_quiz_at to profiles for daily quiz gating
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_quiz_at timestamptz;

-- Mortgages table (used by Chunk 3)
CREATE TABLE IF NOT EXISTS public.mortgages (
  id              text PRIMARY KEY,
  artwork_id      text NOT NULL,
  owner_id        text NOT NULL,
  principal       bigint NOT NULL,
  weekly_interest_rate numeric(6,4) NOT NULL DEFAULT 0.02,
  term_weeks      int NOT NULL DEFAULT 12,
  weeks_remaining int NOT NULL DEFAULT 12,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'defaulted')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  matured_at      timestamptz
);
