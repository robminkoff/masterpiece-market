import { execSync } from "child_process";
import { readFileSync } from "fs";

const PROJECT_REF = "kegdjyxxmvghzvamdggx";

// Get access token from macOS Keychain (same as Supabase CLI uses)
function getAccessToken(): string {
  const raw = execSync('security find-generic-password -s "Supabase CLI" -w 2>/dev/null', {
    encoding: "utf-8",
  }).trim();
  // Token is stored as go-keyring-base64:<base64>
  const b64 = raw.replace("go-keyring-base64:", "");
  return Buffer.from(b64, "base64").toString("utf-8");
}

async function applyMigration() {
  const token = getAccessToken();
  console.log("Got Supabase access token from Keychain");

  const sql = readFileSync("supabase/migrations/0007_text_ids_and_fixes.sql", "utf-8");
  console.log(`Migration SQL: ${sql.length} chars\n`);

  console.log("Executing migration via Supabase Management API...\n");

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`API error ${res.status}: ${text}`);
    process.exit(1);
  }

  const result = await res.json();
  console.log("Migration result:", JSON.stringify(result, null, 2).slice(0, 2000));
  console.log("\nMigration applied successfully!");
  console.log("Run `npx tsx scripts/check-migration.ts` to verify.");
}

applyMigration().catch(console.error);
