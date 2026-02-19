"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  username: string;
  display_name: string;
  created_at: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => setProfile(null));
  }, []);

  // Redirect to setup if no profile and not already on /setup
  const needsSetup = profile === null && pathname !== "/setup";
  useEffect(() => {
    if (needsSetup) {
      router.replace("/setup");
    }
  }, [needsSetup, router]);

  // While loading or redirecting, show skeleton nav
  if (profile === undefined || needsSetup) {
    return (
      <>
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14" />
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </>
    );
  }

  // On /setup, don't show nav
  if (pathname === "/setup") {
    return <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>;
  }

  const profileLink = profile ? `/u/${profile.username}` : "/setup";

  return (
    <>
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-0 sm:flex sm:items-center sm:justify-between sm:h-14">
          <Link href="/" className="font-bold text-lg tracking-tight block text-center sm:text-left">
            <span className="text-[var(--accent-dark)]">Masterpiece</span> Market
          </Link>
          <div className="flex justify-center gap-4 sm:gap-6 text-sm mt-1.5 sm:mt-0 overflow-x-auto pb-1 sm:pb-0">
            <Link href="/catalog" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Catalog
            </Link>
            <Link href="/marketplace" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Marketplace
            </Link>
            <Link href="/auction-house" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Auction House
            </Link>
            <Link href="/museum" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Museums
            </Link>
            <Link href="/rules" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Rules
            </Link>
            <Link href="/dashboard" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Dashboard
            </Link>
            <Link href={profileLink} className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Profile
            </Link>
            <Link href="/account" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
              Account
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
