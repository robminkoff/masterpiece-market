"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const USERNAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

interface Profile {
  username: string;
  display_name: string;
  created_at: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setUsername(data.profile.username);
          setDisplayName(data.profile.display_name);
        }
        setLoading(false);
      });
  }, []);

  const usernameValid = username.length >= 3 && username.length <= 20 && USERNAME_RE.test(username);
  const displayNameValid = displayName.trim().length >= 1 && displayName.trim().length <= 40;
  const canSubmit = usernameValid && displayNameValid && !saving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

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

    const data = await res.json();
    setProfile(data.profile);
    setSuccess(true);
    setSaving(false);
  }

  async function handleReset() {
    setResetting(true);
    await fetch("/api/reset", { method: "POST" });
    window.location.href = "/setup";
  }

  if (loading) {
    return <div className="py-16 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <form onSubmit={handleSave} className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white dark:bg-[#18182a] shadow-sm mb-8">
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
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-dark)] mb-4"
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400 mb-3">Changes saved.</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {profile && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Account created {new Date(profile.created_at).toLocaleDateString()}
          </p>
        )}
      </form>

      {/* Danger zone */}
      <div className="border border-red-200 dark:border-red-900 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/20">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Reset the game to its initial state. All progress, credits, and collection data will be lost.
        </p>

        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
          >
            Reset Game
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {resetting ? "Resetting..." : "Confirm Reset"}
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
