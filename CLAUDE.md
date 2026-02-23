# Masterpiece Market — Claude Code Instructions

## Database Migrations

When creating new SQL migration files in `supabase/migrations/`, **always apply them** after writing:

```bash
npx tsx scripts/apply-migration.ts <filename>
```

Examples:
```bash
# Apply a specific migration
npx tsx scripts/apply-migration.ts 0010_solo_mode.sql

# Apply the latest (highest-numbered) migration automatically
npx tsx scripts/apply-migration.ts
```

The script uses the Supabase Management API with a token from macOS Keychain. No Docker or local Supabase needed.

## Build Verification

After making changes, verify:
```bash
npx tsc --noEmit    # Type check
npx next build      # Full build
```

## Key Architecture Notes

- **API routes** use `getAuthUserId()` from `src/lib/auth.ts` for auth
- **Admin DB access** uses `supabaseAdmin` from `src/lib/supabase-admin.ts` (service role, bypasses RLS)
- **Solo mode** is fully isolated from multiplayer — `solo_runs` table with JSONB state, no shared data
- **Sim engine** lives in `scripts/sim/` (Monte Carlo analysis); solo engine in `src/lib/solo-engine.ts` (player-facing)
- **PRNG** is Mulberry32 deterministic — `src/lib/prng.ts` for solo, `scripts/sim/prng.ts` for sim
