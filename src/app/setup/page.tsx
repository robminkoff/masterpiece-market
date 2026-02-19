"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const USERNAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export default function SetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const usernameValid = username.length >= 3 && username.length <= 20 && USERNAME_RE.test(username);
  const displayNameValid = displayName.trim().length >= 1 && displayName.trim().length <= 40;
  const canSubmit = usernameValid && displayNameValid && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, display_name: displayName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-gray-200 dark:border-gray-800 rounded-xl p-8 bg-white dark:bg-[#18182a] shadow-sm"
      >
        <h1 className="text-2xl font-bold mb-1 tracking-tight">
          Welcome to <span className="text-[var(--accent-dark)]">Masterpiece</span> Market
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Choose a username and display name to get started.
        </p>

        <label className="block text-sm font-medium mb-1" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="your-username"
          maxLength={20}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-dark)] mb-1"
        />
        <p className="text-xs text-gray-400 mb-4">
          3-20 characters, lowercase letters, numbers, and hyphens.
        </p>

        <label className="block text-sm font-medium mb-1" htmlFor="displayName">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your Display Name"
          maxLength={40}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-dark)] mb-6"
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Creating account..." : "Start Playing"}
        </button>
      </form>
    </div>
  );
}
