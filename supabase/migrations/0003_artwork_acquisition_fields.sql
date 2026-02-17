-- Add acquisition/source metadata and native dimensions to artworks
-- Supports the Acquisition Pipeline (see docs/ACQUISITIONS.md)

alter table artworks
  add column if not exists native_width     integer,
  add column if not exists native_height    integer,
  add column if not exists dominant_orientation text generated always as (
    case
      when native_width is null or native_height is null then null
      when native_width > native_height then 'landscape'
      when native_height > native_width then 'portrait'
      else 'square'
    end
  ) stored,
  add column if not exists source           text,          -- met | rijks | nga | iiif | wikimedia
  add column if not exists source_id        text,          -- museum object ID or Commons filename
  add column if not exists source_url       text,
  add column if not exists rights_note      text default 'public domain',
  add column if not exists image_url_web    text,          -- 1400px long side
  add column if not exists image_url_thumb  text,          -- 400px long side
  add column if not exists status           text default 'active' check (status in ('active', 'needs_review', 'retired'));

comment on column artworks.source is 'Acquisition source: met, rijks, nga, iiif, wikimedia';
comment on column artworks.dominant_orientation is 'Auto-computed: portrait, landscape, or square';
comment on column artworks.status is 'active = live in game, needs_review = QA failed, retired = removed';
