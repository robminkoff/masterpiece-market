import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-8">
      <h1 className="text-5xl font-bold tracking-tight">
        <span className="text-[var(--accent-dark)]">Masterpiece</span> Market
      </h1>

      <p className="text-lg max-w-xl text-gray-600 dark:text-gray-400">
        Collect iconic artworks. Bid in live auctions. Manage insurance, loans,
        and expertise. Build a legendary collection — or lose it all to carrying
        costs.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/signup"
          className="bg-[var(--accent-dark)] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Create Account
        </Link>
        <Link
          href="/signin"
          className="border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Sign In
        </Link>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/auction-house"
          className="bg-[var(--accent-dark)]/80 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Enter Auction House
        </Link>
        <Link
          href="/marketplace"
          className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Browse Marketplace
        </Link>
        <Link
          href="/catalog"
          className="border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          View Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-4xl w-full text-left">
        <FeatureCard
          title="Live Auctions"
          desc="Real-time bidding with countdown timers. Outbid rivals for masterpieces."
        />
        <FeatureCard
          title="Carry Costs"
          desc="Insurance + storage bills every week. Stay active or risk forced sales."
        />
        <FeatureCard
          title="Curator Loans"
          desc="Loan works to NPC curators for income and reduced premiums."
        />
        <FeatureCard
          title="Quick Sales"
          desc="Sell instantly to a dealer at 50% IV, or send to auction and risk the market."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}
