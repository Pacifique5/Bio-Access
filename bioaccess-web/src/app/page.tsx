"use client";

import Link from "next/link";
import MarketingNav from "@/components/marketing/Navbar";
import MarketingFooter from "@/components/marketing/Footer";

const FEATURES = [
  {
    title: "Per-employee fingerprints",
    desc: "Each person enrolls their own fingerprint at registration. Credentials are bound to their account — not shared across the organization.",
  },
  {
    title: "Verified check-in & check-out",
    desc: "Select an employee, scan their finger, and only then is attendance recorded. Wrong fingerprint means access denied.",
  },
  {
    title: "Employee management",
    desc: "Register staff with departments, roles, and contact details. Search, edit, and manage your workforce from one place.",
  },
  {
    title: "Live dashboard",
    desc: "See who's present, who's absent, and track check-ins in real time with weekly attendance trends.",
  },
  {
    title: "Reports & exports",
    desc: "Generate daily, weekly, and monthly reports. Export to CSV for payroll, HR, or compliance workflows.",
  },
  {
    title: "Audit trail",
    desc: "Every login, enrollment, check-in, and check-out is logged with timestamps for full accountability.",
  },
];

const STEPS = [
  { n: "01", title: "Add employee", desc: "Enter their details in the admin panel and save their profile." },
  { n: "02", title: "Enroll fingerprint", desc: "Employee scans their finger via Windows Hello. One credential per person." },
  { n: "03", title: "Daily attendance", desc: "At check-in they select their name and verify identity. Done in seconds." },
];

const USE_CASES = [
  { title: "Offices & startups", desc: "Replace sign-in sheets with biometric verification your team actually trusts." },
  { title: "Schools & universities", desc: "Track student or staff attendance with per-person fingerprint enrollment." },
  { title: "Clinics & facilities", desc: "Know exactly who is on-site without shared PINs or buddy punch-ins." },
];

const FAQ = [
  {
    q: "Do I need special fingerprint hardware?",
    a: "No. BioAccess uses Windows Hello through your browser — the same fingerprint reader built into your Windows laptop or PC.",
  },
  {
    q: "Can someone else check in for an employee?",
    a: "No. The system verifies the fingerprint matches the enrolled credential for that specific employee. Another person's finger will fail.",
  },
  {
    q: "Which browser should I use?",
    a: "Chrome or Microsoft Edge on Windows. Open the app at http://localhost:3000 during setup.",
  },
  {
    q: "Is there a separate backend to install?",
    a: "No. BioAccess is a single Next.js application. Run npm run dev and ensure PostgreSQL is running.",
  },
];

const TESTIMONIALS = [
  {
    quote: "We replaced our paper sign-in sheet in a day. Now we actually know who arrived — not just that someone signed.",
    name: "Operations Manager",
    org: "Regional clinic",
  },
  {
    quote: "Fingerprint per employee stopped buddy punching completely. Setup took less than an hour for our whole team.",
    name: "HR Lead",
    org: "Tech startup, 40 staff",
  },
  {
    quote: "The dashboard gives us daily attendance at a glance. CSV exports go straight to payroll every Friday.",
    name: "Finance Admin",
    org: "Training institute",
  },
];

const PRICING = [
  {
    name: "Self-hosted",
    price: "Free",
    period: "ready to deploy",
    features: ["Unlimited employees", "Fingerprint enrollment", "Attendance & reports", "CSV export", "Activity audit logs"],
    highlight: true,
  },
  {
    name: "Enterprise-ready",
    price: "Minutes",
    period: "to go live",
    features: ["Windows Hello via WebAuthn", "PostgreSQL backend", "Single npm command", "Admin dashboard", "Per-user credentials"],
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50 to-white">
        <div className="marketing-container grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="section-label">Biometric attendance platform</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-900 md:text-5xl lg:text-[3.25rem]">
              Know who checked in.
              <span className="block text-zinc-500">Not just that someone did.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600">
              BioAccess ties every fingerprint to a specific employee. Register once, verify every day, and run your entire attendance operation from a clean admin dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-brand px-7 py-3">
                Get started free
              </Link>
              <a href="#features" className="btn-outline px-7 py-3">
                See features
              </a>
            </div>
            <p className="mt-6 text-sm text-zinc-500">
              No credit card · Works on Windows · Setup in minutes
            </p>
          </div>

          {/* Product preview */}
          <div className="panel overflow-hidden shadow-lg shadow-zinc-200/50">
            <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <span className="ml-2 text-xs text-zinc-400">BioAccess Dashboard</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { l: "Employees", v: "48" },
                { l: "Present", v: "42" },
                { l: "Absent", v: "6" },
                { l: "Rate", v: "88%" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-500">{s.l}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">✓</span>
                <div>
                  <p className="text-sm font-medium text-emerald-900">Check-in verified</p>
                  <p className="text-xs text-emerald-700">Sarah M. · Engineering · 8:47 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-zinc-100 py-10">
        <div className="marketing-container grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: "Per-user verification", sub: "No shared credentials" },
            { label: "Windows Hello", sub: "Fingerprint · Face · PIN" },
            { label: "Real-time dashboard", sub: "Live attendance data" },
            { label: "CSV reports", sub: "Daily to monthly" },
          ].map((item) => (
            <div key={item.label} className="text-center md:text-left">
              <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-zinc-100 bg-zinc-900 py-16 text-white">
        <div className="marketing-container grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { value: "100%", label: "Per-user verification" },
            { value: "<2 min", label: "Employee enrollment" },
            { value: "7-day", label: "Attendance trends" },
            { value: "CSV", label: "Payroll-ready exports" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-semibold tracking-tight text-emerald-400">{s.value}</p>
              <p className="mt-1 text-sm text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="marketing-container">
          <p className="section-label">Features</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-zinc-900">
            Everything you need to run attendance properly
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-zinc-200 p-6 transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-zinc-100 bg-zinc-50 py-24">
        <div className="marketing-container">
          <p className="section-label">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Up and running in three steps</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="text-4xl font-bold text-zinc-200">{s.n}</span>
                <h3 className="mt-2 text-lg font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24">
        <div className="marketing-container">
          <p className="section-label">Use cases</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Built for real organizations</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {USE_CASES.map((u) => (
              <div key={u.title} className="panel p-6">
                <h3 className="font-semibold">{u.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-24">
        <div className="marketing-container">
          <p className="section-label">Testimonials</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Trusted by teams who care about accuracy</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="panel p-6">
                <blockquote className="text-sm leading-relaxed text-zinc-600">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="text-sm font-medium text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.org}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="marketing-container">
          <p className="section-label">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Simple, transparent, self-hosted</h2>
          <p className="mt-3 max-w-xl text-zinc-600">Run BioAccess on your own infrastructure. No subscriptions, no per-seat fees.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 md:max-w-3xl">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${plan.highlight ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}
              >
                <p className={`text-sm font-semibold ${plan.highlight ? "text-emerald-400" : "text-emerald-700"}`}>{plan.name}</p>
                <p className="mt-2 text-4xl font-semibold">{plan.price}</p>
                <p className={`mt-1 text-sm ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{plan.period}</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex gap-2 text-sm ${plan.highlight ? "text-zinc-300" : "text-zinc-600"}`}>
                      <span className={plan.highlight ? "text-emerald-400" : "text-emerald-600"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 block w-full rounded-lg px-5 py-3 text-center text-sm font-medium transition-colors ${
                    plan.highlight ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-y border-zinc-100 bg-zinc-900 py-24 text-white">
        <div className="marketing-container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Security</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Identity you can trust</h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              BioAccess uses WebAuthn — the same standard behind passkeys and modern banking auth. Fingerprint data never leaves your device. We store only a cryptographic credential linked to each employee.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "Windows Hello platform authenticator",
              "Bcrypt-hashed admin passwords",
              "Per-employee credential isolation",
              "Full activity audit logging",
              "Role-based employee records",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="marketing-container max-w-3xl">
          <p className="section-label">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Common questions</h2>
          <div className="mt-10 divide-y divide-zinc-200">
            {FAQ.map((item) => (
              <div key={item.q} className="py-6">
                <h3 className="font-medium text-zinc-900">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="marketing-container text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Ready to modernize attendance?</h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-600">
            Sign in to the admin panel, register your first employee, and enroll their fingerprint in under two minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn-brand px-8 py-3 text-base">
              Sign in to dashboard
            </Link>
            <Link href="/login" className="btn-outline px-8 py-3 text-base">
              Explore dashboard
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
