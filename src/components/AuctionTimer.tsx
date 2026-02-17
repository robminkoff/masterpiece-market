"use client";

import { useEffect, useState } from "react";

export function AuctionTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("ENDED");
        setUrgent(false);
        return;
      }
      setUrgent(diff < 30_000);
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <span
      className={`font-mono text-lg font-bold ${
        urgent ? "text-red-500 animate-pulse" : "text-gray-700 dark:text-gray-300"
      }`}
    >
      {remaining}
    </span>
  );
}
