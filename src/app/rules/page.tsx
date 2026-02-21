export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Rules</h1>

      {/* ====== The Premise ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">The Premise</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          You are a high-net-worth art collector in a simulated art world. Every
          artwork in the game is treated as a singular, genuine original within
          this universe&mdash;unobtainable in real life, tradable here. Your goal
          is to build an extraordinary collection without going bankrupt under the
          responsibility of ownership.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          The central tension: <strong>prestige vs responsibility</strong>. The
          more valuable the work, the harder it is to keep.
        </p>
      </section>

      {/* ====== Currency and Value ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Currency and Value</h2>

        <h3 className="font-semibold mt-4 mb-2">Credits (cr)</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          Credits are the only currency. They are not dollars and are not meant
          to imply real-world money.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          You use credits to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-4">
          <li>Bid in auctions</li>
          <li>Buy from dealer inventory</li>
          <li>Pay weekly ownership costs</li>
          <li>Survive downturns and mistakes</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">Insured Value (IV)</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          Every artwork has an Insured Value (IV) in credits. IV determines:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-2">
          <li>Weekly ownership cost (&ldquo;burn&rdquo;)</li>
          <li>Dealer backstop amount for unsold auction lots (25% of IV)</li>
          <li>Dealer direct-sale amount (50% of IV)</li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          IV is initially seeded and may be adjusted conservatively as the market
          matures.
        </p>
      </section>

      {/* ====== Ownership States ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Ownership States</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          Every artwork is always in one of two states:
        </p>
        <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-3">
          <li>
            <strong>Owned</strong> &mdash; Held by a collector (player).
          </li>
          <li>
            <strong>Available</strong> &mdash; Held by a dealer NPC,
            purchasable from their inventory or available for auction.
          </li>
        </ol>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Ownership is the core identity. The Catalog shows who owns what.
        </p>
      </section>

      {/* ====== Roles ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Roles in the World</h2>

        <h3 className="font-semibold mt-4 mb-1">Collectors (players)</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          You are a collector. Your job is to acquire, hold, and manage the
          burden of ownership.
        </p>

        <h3 className="font-semibold mt-4 mb-1">Dealers (NPCs)</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Dealers hold available works, sell from their inventory, run auctions,
          and provide last-resort liquidity. Dealers do not bid during auctions.
        </p>

        <h3 className="font-semibold mt-4 mb-1">Curators (NPCs)</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Curators borrow works from collectors for exhibitions. Loaning a work
          to a curator reduces your weekly insurance premium and earns a loan
          fee. Curator pages show what they are curating, not what they own.
        </p>

        <h3 className="font-semibold mt-4 mb-1">Critics (NPCs)</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Critics publish reviews and market commentary that reflect on artworks
          and the state of the market. Their writing provides context and color.
        </p>
      </section>

      {/* ====== Player Tiers ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Player Tiers</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Players progress through four tiers: <strong>Emerging</strong>,{" "}
          <strong>Established</strong>, <strong>Connoisseur</strong>, and{" "}
          <strong>Patron</strong>. Your tier determines which NPCs you can
          interact with&mdash;some curators, dealers, and other NPCs are only
          available at higher tiers.
        </p>
      </section>

      {/* ====== Prestige and Stewardship ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Prestige and Stewardship</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          Two scores track your standing as a collector:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
          <li>
            <strong>Prestige</strong> &mdash; Your reputation in the art world.
            Built through acquisitions, exhibitions, and market activity.
          </li>
          <li>
            <strong>Stewardship</strong> &mdash; Your track record as a
            responsible owner. Paying obligations on time, making loans, and
            participating in exhibitions improve it. Delinquencies damage it.
            Stewardship is required for museum founding.
          </li>
        </ul>
      </section>

      {/* ====== How You Play ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">How You Play</h2>

        <h3 className="font-semibold mt-4 mb-2">1. Browse the Catalog</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          The Catalog shows all works and their current owners.
        </p>

        <h3 className="font-semibold mt-4 mb-2">2. Acquire Artworks</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          There are two ways to acquire artworks:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-3">
          <li>
            <strong>Bid in auctions</strong> &mdash; Browse upcoming auctions,
            join live bidding rooms, and win lots. Auctions extend briefly when
            bids arrive in the final seconds, preventing last-moment sniping.
          </li>
          <li>
            <strong>Buy from dealer inventory</strong> &mdash; Browse the
            Marketplace to purchase available works directly from dealers at
            their listed price.
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3 font-medium bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-lg">
          Acquisition Limit: You may acquire at most <strong>1 artwork per week</strong> through
          dealer purchases and mystery packages. Auction wins are not subject to this limit.
        </p>

        <h3 className="font-semibold mt-4 mb-2">3. Hold and Manage Your Collection</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Owning art costs credits every week. You must maintain enough credits
          to cover your burn. After acquiring an artwork, there is a{" "}
          <strong>24-hour hold period</strong> before you can sell or consign it.
        </p>

        <h3 className="font-semibold mt-4 mb-2">4. Loan to Curators</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          You may loan works to curators for their exhibitions. While on loan,
          an artwork&rsquo;s weekly insurance premium is significantly reduced,
          and the curator pays you a loan fee. This is the primary way to offset
          carry costs on expensive works.
        </p>

        <h3 className="font-semibold mt-4 mb-2">5. Sell</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          You can sell in two ways:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
          <li>
            <strong>Consign to auction</strong> &mdash; Market outcome;
            potentially the best price, but risky if bidding is weak.
          </li>
          <li>
            <strong>Direct sell to dealer</strong> &mdash; Instant sale at 50%
            of IV. A steep haircut, but guaranteed liquidity.
          </li>
        </ul>
      </section>

      {/* ====== Ownership Costs ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Ownership Costs</h2>

        <h3 className="font-semibold mt-4 mb-2">Weekly Burn</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Each owned work costs credits every week.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg">
          Weekly Burn = (IV &times; Tier Rate) + Tier Storage Fee
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Tiers express <strong>responsibility</strong>, not fame. Higher tiers
          carry higher weekly costs.
        </p>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Tier</th>
                <th className="text-left p-3 font-medium text-gray-500">IV Threshold</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">A</td>
                <td className="p-3">&ge; 350,000 cr</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">B</td>
                <td className="p-3">&ge; 75,000 cr</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">C</td>
                <td className="p-3">&ge; 50,000 cr</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">D</td>
                <td className="p-3">&lt; 50,000 cr</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Exact rates per tier can be viewed on any artwork&rsquo;s detail page.
        </p>
      </section>

      {/* ====== Auctions ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Auctions</h2>

        <h3 className="font-semibold mt-4 mb-2">Bidding</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Auctions are a primary market channel. There is no house bidding and no
          disguised bidding. When a bid is placed in the final seconds, the
          auction extends briefly to give other bidders a chance to respond.
          Small fees (buyer premium and seller commission) apply at settlement.
        </p>

        <h3 className="font-semibold mt-4 mb-2">Dealer Backstop</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          Each auction lot has a backstop: <strong>25% of IV</strong>.
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-3">
          <li>
            If the winning bid meets or exceeds the backstop &rarr; normal sale
            to the high bidder.
          </li>
          <li>
            If the high bid falls short (or there are no bids) &rarr; the lot is
            bought in by the dealer at the backstop amount. The seller receives
            the backstop immediately.
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          The backstop is intentionally painful. Auctions are riskier than
          dealer sales, but can be far more lucrative.
        </p>
      </section>

      {/* ====== Direct Sale ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Direct Sale to Dealer</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          At any time (after the 24-hour hold period), an owner may sell a work
          directly to a dealer for <strong>50% of IV</strong> in instant credits.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          This is last-resort liquidity. It is deliberately unattractive compared
          to a strong auction outcome, but it prevents soft-lock bankruptcy.
        </p>
      </section>

      {/* ====== Bankruptcy ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          Bankruptcy, Delinquency, and Forced Outcomes
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          You can keep works indefinitely as long as you can pay your weekly
          burn. If you cannot cover your obligations:
        </p>
        <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li>
            You enter <strong>Delinquency</strong>
          </li>
          <li>You get a short grace window</li>
          <li>
            If still unpaid, the system forces sales or consignments until your
            obligations are covered
          </li>
        </ol>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          This is the game&rsquo;s consequences engine. Overreach can dismantle
          a great collection.
        </p>
      </section>

      {/* ====== Starting Credits ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Starting Credits and Top-Ups</h2>

        <h3 className="font-semibold mt-4 mb-2">Starting Credits</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Players begin with <strong>1,000,000 cr</strong>.
        </p>

        <h3 className="font-semibold mt-4 mb-2">Top-Up Packs</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          Players can acquire additional credits in fixed packs:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-2">
          <li>100,000 cr</li>
          <li>250,000 cr</li>
          <li>500,000 cr</li>
          <li>1,000,000 cr</li>
        </ul>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Top-up amounts may be adjusted during beta to maintain economic
          balance.
        </p>
      </section>

      {/* ====== Clarity ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Clarity and Status</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          The game always makes your condition obvious:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li>
            <strong>Cash</strong> (cr)
          </li>
          <li>
            <strong>Collection Value</strong> (total IV)
          </li>
          <li>
            <strong>Weekly Burn</strong>
          </li>
          <li>
            <strong>Runway</strong> (weeks your cash can cover your burn)
          </li>
          <li>
            <strong>Health badge</strong>: Safe / Tight / At Risk
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Players should never be surprised by delinquency.
        </p>
      </section>

      {/* ====== Social ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Social Layer</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          Collectors may:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li>View each other&rsquo;s profiles and collections</li>
          <li>See ownership changes through activity feeds</li>
          <li>Communicate (when enabled)</li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          This supports the core fantasy: status, rivalry, taste, and reputation.
        </p>
      </section>

      {/* ====== Museum ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          Endgame: Founding a Museum
        </h2>

        <h3 className="font-semibold mt-4 mb-2">The Crowning Achievement</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          The highest achievement is founding an eponymous museum (e.g.,
          &ldquo;The ___ Museum&rdquo;). This creates a permanent legacy.
        </p>

        <h3 className="font-semibold mt-4 mb-2">Requirements</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          To found a museum, you must demonstrate breadth, quality, and
          responsible stewardship:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li>A collection spanning multiple tiers with sufficient size</li>
          <li>Diversity of artistic styles and periods across your holdings</li>
          <li>A minimum stewardship score</li>
          <li>A minimum prestige score</li>
          <li>Sufficient credits on hand as an endowment</li>
        </ul>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Exact thresholds may be tuned as the game evolves.
        </p>

        <h3 className="font-semibold mt-4 mb-2">Ascension</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Founding a museum is an <strong>ascension event</strong>. Your
          collection returns to the market through a celebratory Founding Sale,
          and you begin a fresh run. The museum is the reward and the permanent
          record. The climb begins again.
        </p>

        <h3 className="font-semibold mt-4 mb-2">Museum Founder Bonus</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          Each museum you found increases your next run&rsquo;s starting
          bankroll:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li>
            <strong>+1,000,000 cr</strong> per museum founded
          </li>
          <li>
            <strong>Maximum: 9 museums</strong> (9,000,000 cr bonus cap)
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-mono text-sm bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg">
          Next-run starting credits = 1,000,000 + min(Museums Founded, 9) &times;
          1,000,000
        </p>
      </section>

      {/* ====== Spirit ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">The Spirit of the Game</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          This is a game about:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li>Taste as status</li>
          <li>Ownership as identity</li>
          <li>Responsibility as pressure</li>
          <li>The thrill of winning the unobtainable</li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Boldness is rewarded. Overreach is punished. The market is alive
          because collectors must constantly balance prestige with survival.
        </p>
      </section>
    </div>
  );
}
