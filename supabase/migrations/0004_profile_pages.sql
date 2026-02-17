-- Profile Pages — add username, NPC slugs, credits, prestige, stewardship, npc_data, critic role

-- Profiles: add username
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- NPCs: add slug and profile-page fields
ALTER TABLE public.npcs ADD COLUMN slug text UNIQUE NOT NULL DEFAULT '';
ALTER TABLE public.npcs ADD COLUMN credits integer DEFAULT 0;
ALTER TABLE public.npcs ADD COLUMN prestige integer DEFAULT 0;
ALTER TABLE public.npcs ADD COLUMN stewardship_score integer DEFAULT 50;
ALTER TABLE public.npcs ADD COLUMN npc_data jsonb DEFAULT '{}';

-- Add "critic" to the NPC role check constraint
ALTER TABLE public.npcs DROP CONSTRAINT IF EXISTS npcs_role_check;
ALTER TABLE public.npcs ADD CONSTRAINT npcs_role_check
  CHECK (role IN ('curator', 'dealer', 'critic'));
