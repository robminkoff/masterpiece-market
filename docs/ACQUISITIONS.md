# Acquisition Pipeline v1

## Overview

The acquisition pipeline lets you add artwork packs to the game on demand. Each pack is a curated set of artworks sourced from museum open-access programs and public image repositories, then processed into game-ready image derivatives and registered in the database.

The workflow follows five stages:

**Find --> Download --> Normalize --> Upload --> Register**

A core principle of the pipeline is that it preserves native aspect ratio with no cropping. Dimension is identity -- the shape of the artwork is part of its character, and the pipeline never distorts or crops it.

---

## Source Priority

Sources are listed from best to fallback. Always prefer the highest-quality, most authoritative source available.

| Priority | Source | Notes |
|----------|--------|-------|
| 1 | Museum Open Access | Met Collection API, Rijksmuseum API, NGA Open Access |
| 2 | IIIF Image API | When institutions expose a IIIF endpoint |
| 3 | Wikimedia Commons | Good fallback for works not available via the above |

---

## Pack CSV Format

Pack files live at:

```
acquisitions/packs/{name}.csv
```

### Columns

| Column | Description |
|--------|-------------|
| `title` | Artwork title |
| `artist` | Artist name |
| `year` | Year of creation |
| `source` | Source identifier: `met`, `rijks`, `nga`, `iiif`, or `wikimedia` |
| `source_id` | Identifier within the source system |
| `source_url` | Direct URL to the source record |
| `rights_note` | Rights/license information (required) |
| `tier` | Quality/rarity tier: `A`, `B`, `C`, or `D` |
| `insured_value` | In-game insured value |
| `tags` | Pipe-separated tags (e.g. `landscape|oil|large`) |

---

## Source Adapters

Each source has a dedicated adapter that knows how to fetch the full-resolution image.

### Met adapter

Calls the Met Collection API:

```
https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}
```

Uses the `primaryImage` field from the response to download the full-resolution image.

### Rijks adapter

Calls the Rijksmuseum API to retrieve image tiles or the direct download URL for the artwork.

### NGA adapter

Scrapes the open-access download link from the National Gallery of Art object page.

### IIIF adapter

Requests the full image via the IIIF Image API:

```
{service_url}/full/full/0/default.jpg
```

### Wikimedia adapter

Uses the MediaWiki API to get the full-resolution URL:

```
action=query&prop=imageinfo
```

Extracts the original file URL from the `imageinfo` response.

---

## Image Derivatives

For each artwork, three files are generated. No cropping is applied at any stage -- all derivatives preserve the native aspect ratio.

| Derivative | Spec | Purpose |
|------------|------|---------|
| `zoom_master` | Original hi-res, or capped at 4000-6000px on the long side | Detail zoom in the gallery view |
| `display_web` | 1400px on the long side, JPEG quality 80 | Standard web display |
| `thumb` | 400px on the long side | Thumbnails, grid views, cards |

---

## Storage Paths

All image files are stored in the Supabase Storage bucket named `artworks`, organized by derivative type:

```
artworks/originals/{slug}.jpg
artworks/web/{slug}.jpg
artworks/thumbs/{slug}.jpg
```

---

## DB Registration

Each successfully processed artwork results in two database entries.

### artworks table

A row containing:

- Metadata (title, artist, year, tags, tier, insured value)
- Image URLs for all three derivatives
- `native_width` and `native_height` (original dimensions)
- `dominant_orientation` (landscape, portrait, or square)
- Source attribution details

### provenance_events table

A row with:

- `event_type`: `"ingested"`
- Source details (source, source_id, source_url)
- File checksum for integrity verification

---

## QA Gate

Every artwork passes through automated quality checks before it is marked as available.

| Check | Criteria |
|-------|----------|
| Min resolution | Longest side of the master must be >= 2500px |
| Max file size | 50MB cap per file |
| Image integrity | Image loads and decodes correctly |
| Rights note | A rights note must be present |

If any check fails, the artwork is not rejected outright. Instead, its status is set to `"needs_review"` in the `artworks` table so it can be manually inspected and corrected.

---

## Running the Pipeline

### Validate a pack CSV

Check the CSV for formatting errors, missing fields, and invalid values before doing any downloads.

```bash
npx tsx scripts/acquire/run.ts validate acquisitions/packs/06_impressionism.csv
```

### Download and normalize (local only, no upload)

Download source images and generate derivatives locally without uploading to Supabase or registering in the database.

```bash
npx tsx scripts/acquire/run.ts download acquisitions/packs/06_impressionism.csv
```

### Full pipeline

Run the complete workflow: download, normalize, upload to Supabase Storage, and register in the database.

```bash
npx tsx scripts/acquire/run.ts all acquisitions/packs/06_impressionism.csv
```

### Dry run

Preview what the pipeline would do without actually downloading, uploading, or writing to the database.

```bash
npx tsx scripts/acquire/run.ts all acquisitions/packs/06_impressionism.csv --dry-run
```

---

## Starter Year Calendar

The first year of content is organized into 12 monthly packs of approximately 25 works each, totaling around 300 works.

| Pack | Theme |
|------|-------|
| 01 | Renaissance |
| 02 | Baroque |
| 03 | Rococo / Neoclassical |
| 04 | Romantic / Sublime |
| 05 | Realism / Print |
| 06 | Impressionism |
| 07 | Post-Impressionism / Symbolism |
| 08 | Early Modernism |
| 09 | Surrealism |
| 10 | American Modern / Pop |
| 11 | Global Canon |
| 12 | Design / Photo / Architecture |

---

## Troubleshooting

### Rate limiting

All source adapters implement polite delays of 1 second between requests to avoid being blocked by upstream APIs.

### Failed downloads

Failed downloads are tracked in `manifest.json`. To retry only the failed items, run the pipeline again with the retry flag:

```bash
npx tsx scripts/acquire/run.ts all acquisitions/packs/06_impressionism.csv --retry-failed
```

### Wrong image

If a downloaded image is incorrect, manually replace the file in the `originals/` directory and re-run the normalize step to regenerate the web and thumb derivatives.

### Missing rights

If an artwork is missing rights information, its status will be set to `"needs_review"` in the database. Do not publish the artwork until the rights note has been resolved.

---

## Adding a New Pack

1. Create a new CSV file in `acquisitions/packs/` following the pack CSV format described above.
2. Research source IDs for each artwork. Prefer museum open-access sources over Wikimedia Commons whenever possible.
3. Run `validate` to check the CSV for errors.
4. Run `download` to fetch and normalize images locally.
5. Run the full pipeline with `all` to upload and register.
6. Review `manifest.json` for any failures and address them before considering the pack complete.
