"use client";

import { useState } from "react";
import { Sprout } from "lucide-react";

const LANGUAGES = ["English", "हिंदी", "मराठी"];

export default function Header() {
  const [lang, setLang] = useState("English");
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-5 py-4 bg-cream-50">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-gold-100 text-gold-500">
          <Sprout size={16} />
        </span>
        <span className="font-semibold text-ink-900">Kisaan Kareer</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm text-ink-600 px-2 py-1 rounded-sm hover:bg-cream-100"
        >
          {lang} ▾
        </button>
        {open && (
          <div className="absolute right-0 mt-1 bg-paper border border-line rounded-md shadow-sm z-10">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-ink-900 hover:bg-cream-100"
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
