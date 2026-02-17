import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Masterpiece Market",
  description: "An online art market simulation — collect, trade, and steward iconic artworks.",
};

function Nav() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-2 sm:py-0 sm:flex sm:items-center sm:justify-between sm:h-14">
        <Link href="/" className="font-bold text-lg tracking-tight block text-center sm:text-left">
          <span className="text-[var(--accent-dark)]">Masterpiece</span> Market
        </Link>
        <div className="flex justify-center gap-4 sm:gap-6 text-sm mt-1.5 sm:mt-0 overflow-x-auto pb-1 sm:pb-0">
          <Link href="/catalog" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
            Catalog
          </Link>
          <Link href="/auction-house" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
            Auction House
          </Link>
          <Link href="/museum" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
            Museums
          </Link>
          <Link href="/dashboard" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/u/dev-player" className="hover:text-[var(--accent-dark)] transition-colors whitespace-nowrap">
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
