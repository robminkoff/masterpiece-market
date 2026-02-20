import { execSync } from "child_process";

const PROJECT_REF = "kegdjyxxmvghzvamdggx";

function getAccessToken(): string {
  const raw = execSync('security find-generic-password -s "Supabase CLI" -w 2>/dev/null', {
    encoding: "utf-8",
  }).trim();
  const b64 = raw.replace("go-keyring-base64:", "");
  return Buffer.from(b64, "base64").toString("utf-8");
}

async function query(token: string, sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    console.error(`Error ${res.status}:`, await res.text());
    return null;
  }
  return res.json();
}

async function checkSchema() {
  const token = getAccessToken();

  // Check all columns for loan_offers, loans, exhibitions, billing_events, sales
  const cols = await query(token, `
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('loan_offers', 'loans', 'exhibitions', 'billing_events', 'sales')
    ORDER BY table_name, ordinal_position;
  `);
  console.log("Additional table columns:");
  console.log(JSON.stringify(cols, null, 2));

  // Check existing constraints on profiles
  const constraints = await query(token, `
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass;
  `);
  console.log("\nProfile constraints:");
  console.log(JSON.stringify(constraints, null, 2));

  // Check existing constraints on npcs
  const npcConstraints = await query(token, `
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'public.npcs'::regclass;
  `);
  console.log("\nNPC constraints:");
  console.log(JSON.stringify(npcConstraints, null, 2));

  // Check existing foreign keys referencing artworks
  const fks = await query(token, `
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `);
  console.log("\nAll foreign keys:");
  console.log(JSON.stringify(fks, null, 2));

  // Check if handle_new_user trigger/function exists
  const triggers = await query(token, `
    SELECT trigger_name, event_object_table, action_timing, event_manipulation
    FROM information_schema.triggers
    WHERE trigger_schema = 'auth' OR event_object_schema = 'auth';
  `);
  console.log("\nAuth triggers:");
  console.log(JSON.stringify(triggers, null, 2));
}

checkSchema().catch(console.error);
