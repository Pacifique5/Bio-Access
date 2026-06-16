"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [confirmText, setConfirmText] = useState("");

  async function resetAll() {
    if (confirmText !== "RESET") {
      setMessage('Type RESET to confirm');
      return;
    }
    if (!confirm("This deletes ALL users, fingerprints, attendance records, and logs. Continue?")) {
      return;
    }

    const res = await fetch("/api/admin/reset", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setMessage(data.error);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Settings</h2>

      <div className="card mb-6 max-w-xl">
        <h3 className="mb-2 font-semibold">How fingerprint binding works</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-400">
          <li>During registration, each employee scans their own fingerprint (Windows Hello).</li>
          <li>The browser stores a unique credential tied to that employee only.</li>
          <li>At check-in, only that employee&apos;s fingerprint can authenticate.</li>
          <li>Another person&apos;s finger will fail verification.</li>
        </ul>
      </div>

      <div className="card max-w-xl border-red-900/50">
        <h3 className="mb-2 font-semibold text-red-400">Clear Everything</h3>
        <p className="mb-4 text-sm text-slate-400">
          Removes all users, fingerprint credentials, attendance records, and activity logs.
          Admin account is reset to admin / admin123.
        </p>
        <label className="label">Type RESET to confirm</label>
        <input
          className="input mb-4"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="RESET"
        />
        <button className="btn-danger" onClick={resetAll}>
          Clear All Data
        </button>
        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
      </div>
    </div>
  );
}
