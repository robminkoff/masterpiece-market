"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Saves scroll position to sessionStorage on scroll,
 * and restores it after content loads (call `ready()` when data is rendered).
 */
export function useScrollRestore() {
  const pathname = usePathname();
  const key = `scroll:${pathname}`;
  const restored = useRef(false);

  // Save scroll position on scroll
  useEffect(() => {
    restored.current = false;
    const onScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [key]);

  // Call this after data has loaded and rendered
  function ready() {
    if (restored.current) return;
    restored.current = true;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10));
      });
    }
  }

  return { ready };
}
