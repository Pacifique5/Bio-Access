import Link from "next/link";
import Logo from "@/components/Logo";

const LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Security", href: "/#security" },
    { label: "FAQ", href: "/#faq" },
  ],
  App: [
    { label: "Sign in", href: "/login" },
    { label: "Dashboard", href: "/login" },
  ],
};

export default function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="marketing-container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-600">
              Biometric attendance management for organizations that need to know exactly who checked in — not just that someone did.
            </p>
          </div>
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-zinc-600 hover:text-zinc-900">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} BioAccess. All rights reserved.</p>
          <p>Fingerprint attendance · Windows Hello · WebAuthn</p>
        </div>
      </div>
    </footer>
  );
}
