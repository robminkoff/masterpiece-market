import { execSync } from "child_process";

const PROJECT_REF = "kegdjyxxmvghzvamdggx";

function getAccessToken(): string {
  const raw = execSync('security find-generic-password -s "Supabase CLI" -w 2>/dev/null', {
    encoding: "utf-8",
  }).trim();
  const b64 = raw.replace("go-keyring-base64:", "");
  return Buffer.from(b64, "base64").toString("utf-8");
}

async function fix() {
  const token = getAccessToken();

  const sql = `
    -- Change ownerships.id from UUID to TEXT
    ALTER TABLE public.ownerships ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.ownerships ALTER COLUMN id SET DATA TYPE text;

    -- Change provenance_events.id from UUID to TEXT
    ALTER TABLE public.provenance_events ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.provenance_events ALTER COLUMN id SET DATA TYPE text;

    -- Change auctions.id from UUID to TEXT (seed uses text IDs)
    ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_auction_id_fkey;
    ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_auction_id_fkey;
    ALTER TABLE public.auctions ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.auctions ALTER COLUMN id SET DATA TYPE text;
    ALTER TABLE public.bids ALTER COLUMN auction_id SET DATA TYPE text;
    ALTER TABLE public.sales ALTER COLUMN auction_id SET DATA TYPE text;
    ALTER TABLE public.bids ADD CONSTRAINT bids_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(id);
    ALTER TABLE public.sales ADD CONSTRAINT sales_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(id);

    -- Change bids.id from UUID to TEXT
    ALTER TABLE public.bids ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.bids ALTER COLUMN id SET DATA TYPE text;
  `;

  console.log("Fixing ID column types...");
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
    console.error(`Error ${res.status}:`, text);
    process.exit(1);
  }

  console.log("Done! ID columns fixed.");
}

fix().catch(console.error);
