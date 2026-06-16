"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#security" },
  { label: "FAQ", href: "#faq" },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="marketing-container flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-zinc-600 hover:text-zinc-900">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            Sign in
          </Link>
          <Link href="/login" className="btn-brand px-5">
            Get started
          </Link>
        </div>

        <button
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-100 bg-white px-6 py-4 md:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block py-2 text-sm text-zinc-700"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link href="/login" className="btn-brand mt-3 w-full" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
}
