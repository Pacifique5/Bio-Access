"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("admin");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.username) setUsername(d.username);
        if (d.role) setRole(d.role);
      });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(data.message || "Profile updated successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      toast(data.error || "Failed to update profile.", "error");
    }
    setSavingProfile(false);
  }

  async function reset() {
    if (confirm !== "RESET") {
      toast('Type RESET in the box to confirm.', "warning");
      return;
    }
    if (!window.confirm("Delete all employees, fingerprints, attendance, and logs?")) return;

    const res = await fetch("/api/admin/reset", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      toast(data.message || "All data cleared.", "success");
      setTimeout(() => router.push("/login"), 2000);
    } else {
      toast(data.error || "Reset failed.", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="System configuration, requirements, and data management"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h2 className="text-sm font-medium">Profile settings</h2>
          </div>
          <form onSubmit={saveProfile} className="panel-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">Username</label>
              <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <p className="mt-1 text-xs text-zinc-500">Shown in dashboard greeting and audit logs.</p>
            </div>
            <div>
              <label className="field-label">Role</label>
              <input className="field bg-zinc-50" value={role} disabled />
            </div>
            <div>
              <label className="field-label">Current password</label>
              <input
                className="field"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">New password (optional)</label>
              <input
                className="field"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="md:col-span-2">
              <button className="btn-brand" type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
