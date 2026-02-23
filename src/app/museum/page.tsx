"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Museum } from "@/lib/types";

const STATUS_BADGES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  probation: "bg-yellow-100 text-yellow-800",
  dissolved: "bg-gray-100 text-gray-600",
};

const LEVEL_LABELS: Record<string, string> = {
  emerging: "Emerging",
  established: "Established",
  landmark: "Landmark",
};

export default function MuseumListPage() {
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/museums")
      .then((r) => r.json())
      .then((data) => setMuseums(data.museums ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 py-12 text-center">Loading museums...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Museums</h1>
        <Link href="/dashboard" className="text-sm text-[var(--accent-dark)] hover:underline">
          Check founding requirements →
        </Link>
      </div>

      {museums.length === 0 ? (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No museums have been founded yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Meet all founding requirements on your Dashboard to found the first museum.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {museums.map((m) => (
            <Link
              key={m.id}
              href={`/museum/${m.id}`}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_BADGES[m.status]}`}>
                  {m.status}
                </span>
                <span className="text-xs text-gray-400">{LEVEL_LABELS[m.level]}</span>
              </div>
              <h2 className="text-xl font-bold mt-1">{m.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Founded {new Date(m.founded_at).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>Endowment: {m.endowment.toLocaleString()} cr</span>
                <span>Staff: {m.staff_curator_count} curator{m.staff_curator_count !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
