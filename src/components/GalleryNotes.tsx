"use client";

import { useState } from "react";
import type { GalleryNoteSection } from "@/lib/types";

export function GalleryNotes({ notes }: { notes: GalleryNoteSection[] }) {
  const [open, setOpen] = useState(false);

  if (notes.length === 0) return null;

  return (
    <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Gallery Notes — {notes[0].heading}
        </span>
        <span className="text-gray-400 text-sm select-none">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {notes.map((section) => (
            <div key={section.heading}>
              <h4
                className="text-xs font-semibold tracking-wide mb-1"
                style={{ fontVariant: "small-caps", color: "var(--accent-dark, #92400e)" }}
              >
                {section.heading}
              </h4>
              <p
                className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {section.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
