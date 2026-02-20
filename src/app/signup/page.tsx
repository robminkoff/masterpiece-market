"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase";

const USERNAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const usernameValid =
    username.length >= 3 && username.length <= 20 && USERNAME_RE.test(username);
  const displayNameValid =
    displayName.trim().length >= 1 && displayName.trim().length <= 40;
  const emailValid = email.includes("@");
  const passwordValid = password.length >= 6;
  const canSubmit =
    usernameValid && displayNameValid && emailValid && passwordValid && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Sign up with Supabase Auth (store game profile in user_metadata
      //    so it survives the email-confirmation round-trip)
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: displayName },
        },
      });

      if (authError) {
        setError(
          authError.message === "Failed to fetch"
            ? "Could not reach auth server. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
            : authError.message,
        );
        setSaving(false);
        return;
      }

      if (!data.session) {
        setInfo("Check your email to confirm your account, then sign in.");
        setSaving(false);
        return;
      }

      // 2. Update profile with username/display_name
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, display_name: displayName }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to create profile");
        setSaving(false);
        return;
      }

      // 3. Redirect to catalog
      router.push("/catalog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-gray-200 dark:border-gray-800 rounded-xl p-8 bg-white dark:bg-[#18182a] shadow-sm"
      >
        <h1 className="text-2xl font-bold mb-1 tracking-tight">
          Create your{" "}
          <span className="text-[var(--accent-dark)]">Masterpiece</span> Market
          account
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sign up to start collecting and trading art.
        </p>

        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-dark)] mb-4"
        />

        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 6 characters"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-dark)] mb-4"
        />

        <label className="block text-sm font-medium mb-1" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          placeholder="your-username"
          maxLength={20}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-dark)] mb-1"
        />
        <p className="text-xs text-gray-400 mb-4">
          3-20 characters, lowercase letters, numbers, and hyphens.
        </p>

        <label
          className="block text-sm font-medium mb-1"
          htmlFor="displayName"
        >
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

        {info && (
          <p className="text-sm text-green-600 dark:text-green-400 mb-4">
            {info}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-[var(--accent-dark)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
