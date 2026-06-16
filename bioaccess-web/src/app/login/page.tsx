"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      sessionStorage.setItem("bioaccess-login-success", "1");
      router.push("/dashboard");
    } else {
      const data = await res.json();
      toast(data.error || "Invalid credentials", "error");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex">
        <Logo className="[&_span:last-child]:text-white [&_span:first-child]:bg-white [&_span:first-child]:text-zinc-900" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Admin portal</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Your attendance command center
          </h1>
          <p className="mt-4 max-w-md text-zinc-400 leading-relaxed">
            Manage employees, enroll fingerprints, record attendance, and export reports — all from one dashboard built for real organizations.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-400">
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> Per-employee fingerprint enrollment</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> Real-time presence tracking</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> Audit logs &amp; CSV exports</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> Windows Hello via WebAuthn</li>
          </ul>
        </div>
        <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
          ← Back to homepage
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-zinc-50 px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="panel p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-900">Sign in</h2>
            <p className="mt-1 text-sm text-zinc-500">Enter your admin credentials to access the dashboard</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="field-label">Username</label>
                <input
                  className="field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input
                  className="field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-brand w-full py-3">
                {loading ? "Signing in…" : "Sign in to dashboard"}
              </button>
            </form>

            <div className="mt-6 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-center">
              <p className="text-xs font-medium text-zinc-500">Demo credentials</p>
              <p className="mt-1 font-mono text-sm text-zinc-700">admin / admin123</p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400 lg:hidden">
            <Link href="/" className="underline hover:text-zinc-600">Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
