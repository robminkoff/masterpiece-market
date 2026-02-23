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
          The central tension: <strong>expertise vs responsibility</strong>. The
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
          <li>Buy mystery packages</li>
          <li>Pay weekly ownership costs</li>
          <li>Survive downturns and mistakes</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">Insured Value (IV)</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          Every artwork has an Insured Value (IV) in credits. IV determines:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-2">
          <li>Weekly ownership cost (&ldquo;burn&rdquo;)</li>
          <li>Loan fees earned from curators</li>
          <li>Dealer backstop amount for unsold auction lots (25% of IV)</li>
          <li>Dealer direct-sale amount (50% of IV)</li>
          <li>Mortgage borrowing amount (50% of IV)</li>
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

      {/* ====== Expertise ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Expertise</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          Expertise measures your knowledge of and engagement with the art world.
          It is primarily earned through the <strong>Daily Quiz</strong>.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          A minimum expertise score of <strong>10</strong> is required to found a
          museum. This ensures collectors engage with the educational content
          over the course of their journey.
        </p>
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
          There are three ways to acquire artworks:
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
          <li>
            <strong>Mystery packages</strong> &mdash; Buy a mystery package
            for 100,000 cr and receive a random artwork. The tier is weighted
            toward C and B, with a chance at an A-tier masterpiece.
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3 font-medium bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-lg">
          Acquisition Limit: You may acquire at most <strong>1 artwork per week</strong> through
          dealer purchases and mystery packages. Auction wins are not subject to this limit.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          You start with <strong>one D-tier artwork</strong> in your collection
          so you can see carry costs, loan offers, and the collection UI from
          day one.
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
          an artwork&rsquo;s weekly insurance premium is <strong>reduced by 70%</strong>,
          and the curator pays you a loan fee. This is the primary way to offset
          carry costs on expensive works.
        </p>

        <h3 className="font-semibold mt-4 mb-2">5. Take the Daily Quiz</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Each day you can answer an art-knowledge quiz question. Correct answers
          earn <strong>1 expertise point</strong>. The quiz is free to take and
          available 7 days a week. Expertise accumulation is required for museum
          founding.
        </p>

        <h3 className="font-semibold mt-4 mb-2">6. Sell</h3>
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
                <th className="text-left p-3 font-medium text-gray-500">IV Range</th>
                <th className="text-left p-3 font-medium text-gray-500">Premium Rate</th>
                <th className="text-left p-3 font-medium text-gray-500">Storage Fee</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">A</td>
                <td className="p-3">&ge; 350,000 cr</td>
                <td className="p-3">1.50% / wk</td>
                <td className="p-3">1,000 cr</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">B</td>
                <td className="p-3">&ge; 75,000 cr</td>
                <td className="p-3">1.00% / wk</td>
                <td className="p-3">500 cr</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">C</td>
                <td className="p-3">&ge; 50,000 cr</td>
                <td className="p-3">0.75% / wk</td>
                <td className="p-3">250 cr</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">D</td>
                <td className="p-3">&lt; 50,000 cr</td>
                <td className="p-3">0.50% / wk</td>
                <td className="p-3">100 cr</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold mt-4 mb-2">Idle Surcharge</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          If an artwork sits idle (not loaned, not exhibited) for <strong>8
          consecutive weeks</strong>, its premium rate increases by 20%. Any
          qualifying activity resets the counter.
        </p>
      </section>

      {/* ====== Curator Loans ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Curator Loans</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          Curators request to borrow artworks for exhibitions lasting 4&ndash;12
          weeks. While on loan, your premium is <strong>reduced by 70%</strong> and
          you earn a loan fee based on the curator&rsquo;s tier.
        </p>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Curator Tier</th>
                <th className="text-left p-3 font-medium text-gray-500">Loan Fee (% of IV)</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Assistant</td>
                <td className="p-3">1.0%</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Curator</td>
                <td className="p-3">2.0%</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Chief</td>
                <td className="p-3">3.5%</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Legendary</td>
                <td className="p-3">5.0%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold mt-4 mb-2">Genre Bonus</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          When you loan two or more artworks that share a tag (genre) in the
          same week, you earn a <strong>+50% bonus</strong> on the loan fee for
          each matching work. Building a thematic collection around shared
          genres&mdash;impressionist, portrait, sculpture&mdash;is financially
          rewarded.
        </p>
      </section>

      {/* ====== Mortgage ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Mortgage</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          When your runway gets low, you can mortgage an artwork to raise cash
          without selling it.
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li><strong>Borrow:</strong> up to 50% of the artwork&rsquo;s IV</li>
          <li><strong>Interest:</strong> 2% of principal per week</li>
          <li><strong>Term:</strong> 12 weeks to repay</li>
          <li><strong>Limit:</strong> 2 mortgages at a time</li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          If you cannot repay at term end, the artwork is sold at dealer rate
          and the mortgage is settled from the proceeds. Mortgaged works cannot
          be loaned to curators.
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
          Running out of credits is not the end&mdash;your journey concludes with
          the highest achievement tier you&rsquo;ve reached (see Achievements below).
        </p>
      </section>

      {/* ====== Starting Credits ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Starting Conditions</h2>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-3">
          <li>Players begin with <strong>1,000,000 cr</strong></li>
          <li>You receive <strong>one D-tier artwork</strong> to start your collection</li>
          <li>Mystery packages are available from the start</li>
        </ul>
      </section>

      {/* ====== Achievements ====== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Achievement Tiers</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          When your run ends&mdash;whether you found a museum, run out of credits,
          or reach the 104-week limit&mdash;you receive the highest achievement
          tier you qualify for. There is no &ldquo;failure&rdquo;&mdash;just how
          far you climbed.
        </p>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Tier</th>
                <th className="text-left p-3 font-medium text-gray-500">Requirements</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">Hall</td>
                <td className="p-3">2+ artworks, 2+ tags</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">Gallery</td>
                <td className="p-3">4+ artworks, 3+ tags, 1+ B-tier</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">Wing</td>
                <td className="p-3">6+ artworks, 4+ tags, 2+ B-tier, 1+ A-tier</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-semibold">Museum</td>
                <td className="p-3">Full founding requirements (see below)</td>
              </tr>
            </tbody>
          </table>
        </div>
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
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          To found a museum, you must meet all of the following:
        </p>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Requirement</th>
                <th className="text-left p-3 font-medium text-gray-500">Threshold</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">A-tier artworks</td>
                <td className="p-3">1+</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">B-tier artworks</td>
                <td className="p-3">1+</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">C-tier artworks</td>
                <td className="p-3">2+</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">D-tier artworks</td>
                <td className="p-3">4+</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Total artworks</td>
                <td className="p-3">8+</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Tag diversity</td>
                <td className="p-3">5+ unique tags</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Expertise</td>
                <td className="p-3">10+</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Endowment</td>
                <td className="p-3">6 weeks of carry costs in cash</td>
              </tr>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">Mortgages</td>
                <td className="p-3">All cleared (no outstanding)</td>
              </tr>
            </tbody>
          </table>
        </div>

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
            <strong>+250,000 cr</strong> per museum founded
          </li>
          <li>
            <strong>Maximum: 9 museums</strong> (2,250,000 cr bonus cap)
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-mono text-sm bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg">
          Next-run starting credits = 1,000,000 + min(Museums Founded, 9) &times;
          250,000
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
          <li>
            <strong>Museum Progress</strong>: requirement-by-requirement tracker
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
          because collectors must constantly balance expertise with survival.
        </p>
      </section>
    </div>
  );
}
