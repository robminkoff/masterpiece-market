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

async function check() {
  const token = getAccessToken();

  // 1. Check all FKs that reference profiles(id) and their cascade rules
  const fks = await query(token, `
    SELECT
      tc.table_name,
      kcu.column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'profiles'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `);
  console.log("Foreign keys referencing profiles(id):");
  console.log(JSON.stringify(fks, null, 2));

  // 2. Check if profiles table is empty
  const profiles = await query(token, `SELECT count(*) as cnt FROM public.profiles;`);
  console.log("\nProfiles count:", JSON.stringify(profiles));

  // 3. Check auth.users
  const users = await query(token, `SELECT id, email, created_at FROM auth.users;`);
  console.log("\nAuth users:", JSON.stringify(users, null, 2));

  // 4. Check for orphaned data in tables that had TEXT columns (no FK cascade)
  const creditEvents = await query(token, `SELECT count(*) as cnt FROM public.credit_events;`);
  console.log("\nCredit events:", JSON.stringify(creditEvents));

  const bids = await query(token, `SELECT count(*) as cnt FROM public.bids;`);
  console.log("Bids:", JSON.stringify(bids));

  const auctions = await query(token, `SELECT count(*) as cnt FROM public.auctions;`);
  console.log("Auctions:", JSON.stringify(auctions));
}

check().catch(console.error);
