-- 0007: Text IDs, missing columns, tier fix, credit events, execute_sale RPC
-- Generated from actual schema inspection on 2026-02-19.

-- ============================================================
-- 0. ADD MISSING COLUMNS
-- ============================================================

-- profiles: add username
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- artworks: add missing columns expected by the app
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS image_url_web text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS image_url_thumb text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS gallery_notes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS native_width integer;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS native_height integer;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS dominant_orientation text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS rights_note text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- npcs: add missing columns
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS credits bigint NOT NULL DEFAULT 0;
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS prestige integer NOT NULL DEFAULT 0;
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS stewardship_score integer NOT NULL DEFAULT 50;
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS npc_data jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 1. ALTER artworks.id FROM UUID TO TEXT
-- ============================================================

-- Drop ALL FKs that reference artworks.id
ALTER TABLE public.ownerships DROP CONSTRAINT IF EXISTS ownerships_artwork_id_fkey;
ALTER TABLE public.provenance_events DROP CONSTRAINT IF EXISTS provenance_events_artwork_id_fkey;
ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_artwork_id_fkey;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_artwork_id_fkey;
ALTER TABLE public.loan_offers DROP CONSTRAINT IF EXISTS loan_offers_artwork_id_fkey;
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_artwork_id_fkey;
ALTER TABLE public.billing_events DROP CONSTRAINT IF EXISTS billing_events_artwork_id_fkey;
ALTER TABLE public.museum_exhibition_loans DROP CONSTRAINT IF EXISTS museum_exhibition_loans_artwork_id_fkey;

-- Alter artworks.id
ALTER TABLE public.artworks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.artworks ALTER COLUMN id SET DATA TYPE text;

-- Alter referencing columns to text
ALTER TABLE public.ownerships ALTER COLUMN artwork_id SET DATA TYPE text;
ALTER TABLE public.provenance_events ALTER COLUMN artwork_id SET DATA TYPE text;
ALTER TABLE public.auctions ALTER COLUMN artwork_id SET DATA TYPE text;
ALTER TABLE public.sales ALTER COLUMN artwork_id SET DATA TYPE text;
ALTER TABLE public.loan_offers ALTER COLUMN artwork_id SET DATA TYPE text;
ALTER TABLE public.loans ALTER COLUMN artwork_id SET DATA TYPE text;
ALTER TABLE public.billing_events ALTER COLUMN artwork_id SET DATA TYPE text;
ALTER TABLE public.museum_exhibition_loans ALTER COLUMN artwork_id SET DATA TYPE text;

-- Re-add artwork FKs
ALTER TABLE public.ownerships ADD CONSTRAINT ownerships_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id) ON DELETE CASCADE;
ALTER TABLE public.provenance_events ADD CONSTRAINT provenance_events_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id) ON DELETE CASCADE;
ALTER TABLE public.auctions ADD CONSTRAINT auctions_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);
ALTER TABLE public.sales ADD CONSTRAINT sales_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);
ALTER TABLE public.loan_offers ADD CONSTRAINT loan_offers_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);
ALTER TABLE public.loans ADD CONSTRAINT loans_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);
ALTER TABLE public.billing_events ADD CONSTRAINT billing_events_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);
ALTER TABLE public.museum_exhibition_loans ADD CONSTRAINT museum_exhibition_loans_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);

-- ============================================================
-- 2. ALTER npcs.id FROM UUID TO TEXT
-- ============================================================

-- Drop FKs that reference npcs.id
ALTER TABLE public.loan_offers DROP CONSTRAINT IF EXISTS loan_offers_npc_id_fkey;
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_curator_id_fkey;
ALTER TABLE public.exhibitions DROP CONSTRAINT IF EXISTS exhibitions_curator_id_fkey;

-- Alter npcs.id
ALTER TABLE public.npcs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.npcs ALTER COLUMN id SET DATA TYPE text;

-- Alter referencing columns to text
ALTER TABLE public.loan_offers ALTER COLUMN npc_id SET DATA TYPE text;
ALTER TABLE public.loans ALTER COLUMN curator_id SET DATA TYPE text;
ALTER TABLE public.exhibitions ALTER COLUMN curator_id SET DATA TYPE text;

-- Re-add NPC FKs
ALTER TABLE public.loan_offers ADD CONSTRAINT loan_offers_npc_id_fkey FOREIGN KEY (npc_id) REFERENCES public.npcs(id);
ALTER TABLE public.loans ADD CONSTRAINT loans_curator_id_fkey FOREIGN KEY (curator_id) REFERENCES public.npcs(id);
ALTER TABLE public.exhibitions ADD CONSTRAINT exhibitions_curator_id_fkey FOREIGN KEY (curator_id) REFERENCES public.npcs(id);

-- ============================================================
-- 3. CHANGE ownerships.owner_id TO TEXT (no FK — can be user UUID or NPC text ID)
-- ============================================================

ALTER TABLE public.ownerships DROP CONSTRAINT IF EXISTS ownerships_owner_id_fkey;
ALTER TABLE public.ownerships ALTER COLUMN owner_id SET DATA TYPE text;

-- ============================================================
-- 4. CHANGE provenance_events.from_owner / to_owner TO TEXT (no FK)
-- ============================================================

ALTER TABLE public.provenance_events DROP CONSTRAINT IF EXISTS provenance_events_from_owner_fkey;
ALTER TABLE public.provenance_events DROP CONSTRAINT IF EXISTS provenance_events_to_owner_fkey;
ALTER TABLE public.provenance_events ALTER COLUMN from_owner SET DATA TYPE text;
ALTER TABLE public.provenance_events ALTER COLUMN to_owner SET DATA TYPE text;

-- ============================================================
-- 5. CHANGE auctions.seller_id TO TEXT (can be NPC in forced/estate auctions)
-- ============================================================

ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_seller_id_fkey;
ALTER TABLE public.auctions ALTER COLUMN seller_id SET DATA TYPE text;

-- ============================================================
-- 6. CHANGE sales seller_id/buyer_id TO TEXT (can be NPC)
-- ============================================================

ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_seller_id_fkey;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_buyer_id_fkey;
ALTER TABLE public.sales ALTER COLUMN seller_id SET DATA TYPE text;
ALTER TABLE public.sales ALTER COLUMN buyer_id SET DATA TYPE text;

-- ============================================================
-- 7. CHANGE billing_events.owner_id TO TEXT
-- ============================================================

ALTER TABLE public.billing_events DROP CONSTRAINT IF EXISTS billing_events_owner_id_fkey;
ALTER TABLE public.billing_events ALTER COLUMN owner_id SET DATA TYPE text;

-- ============================================================
-- 8. FIX profile tier constraint
-- ============================================================

-- Drop old constraint FIRST, then update rows, then add new constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;

UPDATE public.profiles SET tier = 'emerging' WHERE tier = 'beginner';
UPDATE public.profiles SET tier = 'established' WHERE tier = 'mid';
UPDATE public.profiles SET tier = 'patron' WHERE tier = 'whale';

ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('emerging', 'established', 'connoisseur', 'patron'));

-- Update default tier
ALTER TABLE public.profiles ALTER COLUMN tier SET DEFAULT 'emerging';

-- Update default credits to match game starting credits
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 250000;

-- ============================================================
-- 9. FIX npcs role and unlock_tier constraints
-- ============================================================

ALTER TABLE public.npcs DROP CONSTRAINT IF EXISTS npcs_role_check;
ALTER TABLE public.npcs ADD CONSTRAINT npcs_role_check
  CHECK (role IN ('curator', 'dealer', 'critic'));

-- Drop old constraint FIRST, then update rows, then add new constraint
ALTER TABLE public.npcs DROP CONSTRAINT IF EXISTS npcs_unlock_tier_check;

UPDATE public.npcs SET unlock_tier = 'emerging' WHERE unlock_tier = 'beginner';
UPDATE public.npcs SET unlock_tier = 'established' WHERE unlock_tier = 'mid';
UPDATE public.npcs SET unlock_tier = 'patron' WHERE unlock_tier = 'whale';

ALTER TABLE public.npcs ADD CONSTRAINT npcs_unlock_tier_check
  CHECK (unlock_tier IN ('emerging', 'established', 'connoisseur', 'patron'));

ALTER TABLE public.npcs ALTER COLUMN unlock_tier SET DEFAULT 'emerging';

-- ============================================================
-- 10. UPDATE handle_new_user() trigger — pull username/display_name from metadata
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, credits)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username',
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'Collector'),
    250000
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. ADD credit_events TABLE (append-only ledger)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.credit_events (
  id          text PRIMARY KEY DEFAULT 'cr-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta       bigint NOT NULL,
  reason      text NOT NULL,
  balance     bigint NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_events_user ON public.credit_events(user_id, created_at DESC);

-- ============================================================
-- 12. ADD last_burn_at TO profiles
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_burn_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- 13. CREATE execute_sale() RPC — atomic ownership transfer
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_sale(
  p_artwork_id text,
  p_buyer_id text,
  p_seller_id text,
  p_sale_price bigint,
  p_via text
)
RETURNS jsonb AS $$
DECLARE
  v_new_ownership_id text;
  v_prov_id text;
BEGIN
  -- Deactivate current ownership
  UPDATE public.ownerships
  SET is_active = false
  WHERE artwork_id = p_artwork_id AND is_active = true;

  -- Create new ownership
  v_new_ownership_id := 'own-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 4);
  INSERT INTO public.ownerships (id, artwork_id, owner_id, acquired_via, is_active, idle_weeks, on_loan)
  VALUES (v_new_ownership_id, p_artwork_id, p_buyer_id, p_via, true, 0, false);

  -- Record provenance event
  v_prov_id := 'prov-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 4);
  INSERT INTO public.provenance_events (id, artwork_id, event_type, from_owner, to_owner, price, metadata)
  VALUES (v_prov_id, p_artwork_id, 'purchase', p_seller_id, p_buyer_id, p_sale_price,
    jsonb_build_object('via', p_via));

  RETURN jsonb_build_object(
    'ownership_id', v_new_ownership_id,
    'provenance_id', v_prov_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
