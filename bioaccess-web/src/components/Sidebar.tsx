"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconChart,
  IconDashboard,
  IconFingerprint,
  IconLogout,
  IconSettings,
  IconUsers,
} from "@/components/ui/Icons";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: IconDashboard },
  { href: "/dashboard/users", label: "Employees", icon: IconUsers },
  { href: "/dashboard/attendance", label: "Attendance", icon: IconFingerprint },
  { href: "/dashboard/reports", label: "Reports", icon: IconChart },
  { href: "/dashboard/settings", label: "Settings", icon: IconSettings },
];

export default function Sidebar({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const today = new Date().toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const nav = (
    <>
      <div className="border-b border-zinc-800 px-5 py-5">
        <Link href="/" className="block" onClick={() => setMobileOpen(false)}>
          <p className="text-base font-semibold tracking-tight">BioAccess</p>
          <p className="text-xs text-zinc-500">Admin Console</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`nav-link ${active ? "nav-link-active" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2.5">
          <p className="text-xs text-zinc-500">Signed in as</p>
          <p className="truncate text-sm font-medium">{username}</p>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          <IconLogout className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-zinc-900 text-white md:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative flex h-full w-64 flex-col bg-zinc-900 text-white shadow-xl">
            {nav}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              Menu
            </button>
            <p className="text-sm text-zinc-500">{today}</p>
          </div>
          <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600">
            View site
          </Link>
        </header>
        <div className="px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
