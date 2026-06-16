"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState("");

  async function reset() {
    if (confirm !== "RESET") {
      setMessage('Type RESET in the box below.');
      return;
    }
    if (!window.confirm("Delete all employees, fingerprints, attendance, and logs?")) return;

    const res = await fetch("/api/admin/reset", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 2000);
    } else setMessage(data.error);
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="System configuration, requirements, and data management"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <div className="panel-header">
            <h2 className="text-sm font-medium">Quick links</h2>
          </div>
          <div className="panel-body space-y-3">
            {[
              { href: "/dashboard/users", label: "Manage employees", sub: "Add, edit, enroll fingerprints" },
              { href: "/dashboard/attendance", label: "Record attendance", sub: "Check-in and check-out" },
              { href: "/dashboard/reports", label: "Export reports", sub: "CSV for payroll and HR" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.sub}</p>
                </div>
                <span className="text-zinc-400">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="text-sm font-medium">System requirements</h2>
          </div>
          <div className="panel-body space-y-3 text-sm text-zinc-600">
            <div className="flex justify-between border-b border-zinc-100 pb-3">
              <span>Browser</span>
              <span className="font-medium text-zinc-900">Chrome or Edge (Windows)</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-3">
              <span>Biometric</span>
              <span className="font-medium text-zinc-900">Windows Hello configured</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-3">
              <span>Database</span>
              <span className="font-medium text-zinc-900">PostgreSQL (local)</span>
            </div>
            <div className="flex justify-between">
              <span>Auth standard</span>
              <span className="font-medium text-zinc-900">WebAuthn / FIDO2</span>
            </div>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h2 className="text-sm font-medium">Fingerprint enrollment</h2>
          </div>
          <div className="panel-body text-sm leading-relaxed text-zinc-600">
            <p>
              Each employee enrolls their own fingerprint when registered. At check-in, the system verifies the scan matches that employee&apos;s stored credential — not anyone else&apos;s.
            </p>
            <p className="mt-3">
              Fingerprint data never leaves the device. BioAccess stores only a cryptographic public key linked to each employee account.
            </p>
          </div>
        </div>

        <div className="panel border-red-200 lg:col-span-2">
          <div className="panel-header">
            <h2 className="text-sm font-medium text-red-700">Danger zone — reset all data</h2>
          </div>
          <div className="panel-body">
            <p className="text-sm text-zinc-600">
              Permanently removes all employees, fingerprints, attendance records, and activity logs. Admin account resets to <span className="font-mono">admin / admin123</span>.
            </p>
            <label className="field-label mt-4">Type RESET to confirm</label>
            <input className="field max-w-xs" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button className="btn-red mt-4" onClick={reset}>Clear everything</button>
            {message && <p className="notice-info mt-4">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
