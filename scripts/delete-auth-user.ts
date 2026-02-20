import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

const db = createClient(url, key);

const USER_ID = "d42368bb-53ef-4035-b524-4c1125615ab3";

async function deleteUser() {
  console.log(`Deleting auth user ${USER_ID}...`);

  const { error } = await db.auth.admin.deleteUser(USER_ID);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("Auth user deleted. You can now sign up fresh.");

  // Verify
  const { data } = await db.auth.admin.listUsers();
  console.log(`Remaining auth users: ${data.users.length}`);
}

deleteUser().catch(console.error);
