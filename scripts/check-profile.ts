import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

async function check() {
  // Check auth users
  const { data: { users } } = await db.auth.admin.listUsers();
  console.log("Auth users:");
  for (const u of users) {
    console.log(`  id=${u.id} email=${u.email}`);
    console.log(`  user_metadata:`, JSON.stringify(u.user_metadata));
  }

  // Check profiles
  const { data: profiles } = await db.from("profiles").select("*");
  console.log("\nProfiles:");
  console.log(JSON.stringify(profiles, null, 2));
}

check().catch(console.error);
