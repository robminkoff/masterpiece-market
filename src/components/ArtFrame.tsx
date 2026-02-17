/**
 * ArtFrame — decorative picture frame that conforms to artwork dimensions.
 *
 * The frame wraps the image naturally — tall paintings get tall frames,
 * wide paintings get wide frames. No forced aspect ratio.
 *
 * Layers (outside → in):
 *   outer frame (gradient) → inner mat (cream) → image
 *
 * The image uses object-contain within a max-height constraint so it's
 * fully visible and the frame hugs its natural shape.
 */

"use client";

import { useState } from "react";
import type { ArtworkTier } from "@/lib/types";

const FRAME_STYLES: Record<ArtworkTier, { frame: string; mat: string; shadow: string }> = {
  A: {
    frame: "bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-800",
    mat: "bg-amber-50",
    shadow: "shadow-lg shadow-amber-900/25",
  },
  B: {
    frame: "bg-gradient-to-br from-stone-700 via-stone-500 to-stone-700",
    mat: "bg-stone-50",
    shadow: "shadow-lg shadow-stone-900/20",
  },
  C: {
    frame: "bg-gradient-to-br from-zinc-600 via-zinc-400 to-zinc-600",
    mat: "bg-zinc-50",
    shadow: "shadow-md shadow-zinc-900/15",
  },
  D: {
    frame: "bg-gradient-to-br from-slate-500 via-slate-400 to-slate-500",
    mat: "bg-white",
    shadow: "shadow-sm shadow-slate-900/10",
  },
};

interface ArtFrameProps {
  src: string | null;
  alt: string;
  tier: ArtworkTier;
  size?: "sm" | "lg";
}

export function ArtFrame({ src, alt, tier, size = "sm" }: ArtFrameProps) {
  const style = FRAME_STYLES[tier];
  const [loaded, setLoaded] = useState(false);

  const framePad = size === "lg" ? "p-2.5 sm:p-3.5" : "p-1.5 sm:p-2";
  const matPad = size === "lg" ? "p-2 sm:p-2.5" : "p-1 sm:p-1.5";
  const maxH = size === "lg" ? "max-h-[520px]" : "max-h-[260px]";

  if (!src) {
    return (
      <div className={`${style.frame} ${style.shadow} ${framePad} rounded-sm inline-block`}>
        <div className={`${style.mat} ${matPad}`}>
          <div className={`bg-neutral-900 flex items-center justify-center ${size === "lg" ? "w-64 h-80" : "w-full aspect-[4/3]"}`}>
            <div className="text-neutral-600 flex flex-col items-center gap-1">
              <span className={size === "lg" ? "text-5xl" : "text-2xl"} style={{ fontFamily: "serif" }}>MM</span>
              <span className="text-[10px] tracking-[0.2em] uppercase">No Image</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${style.frame} ${style.shadow} ${framePad} rounded-sm inline-block`}>
      <div className={`${style.mat} ${matPad}`}>
        <div className="bg-neutral-900 leading-[0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onLoad={() => setLoaded(true)}
            className={`block ${maxH} w-auto h-auto transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </div>
    </div>
  );
}
