import { execSync } from "child_process";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const PROJECT_REF = "kegdjyxxmvghzvamdggx";
const MIGRATIONS_DIR = "supabase/migrations";

// Get access token from macOS Keychain (same as Supabase CLI uses)
function getAccessToken(): string {
  const raw = execSync('security find-generic-password -s "Supabase CLI" -w 2>/dev/null', {
    encoding: "utf-8",
  }).trim();
  // Token is stored as go-keyring-base64:<base64>
  const b64 = raw.replace("go-keyring-base64:", "");
  return Buffer.from(b64, "base64").toString("utf-8");
}

function resolveMigrationFile(arg?: string): string {
  if (arg) {
    // Accept full path or just filename
    if (arg.includes("/")) return arg;
    return `${MIGRATIONS_DIR}/${arg}`;
  }

  // No argument: find the latest (highest-numbered) migration file
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    console.error("No migration files found in", MIGRATIONS_DIR);
    process.exit(1);
  }
  return `${MIGRATIONS_DIR}/${files[files.length - 1]}`;
}

async function applyMigration() {
  const migrationFile = resolveMigrationFile(process.argv[2]);
  const fullPath = resolve(migrationFile);

  const token = getAccessToken();
  console.log("Got Supabase access token from Keychain");

  const sql = readFileSync(fullPath, "utf-8");
  console.log(`Migration file: ${migrationFile}`);
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
}

applyMigration().catch(console.error);
