alter table artworks add column if not exists gallery_notes jsonb default '[]'::jsonb;
