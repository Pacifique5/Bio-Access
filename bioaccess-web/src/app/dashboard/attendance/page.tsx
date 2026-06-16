"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import type { AttendanceRecord, User } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";

export default function AttendancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"info" | "success" | "error">("info");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [u, a] = await Promise.all([fetch("/api/users"), fetch("/api/attendance")]);
    const all = await u.json();
    setUsers(all.filter((x: User) => x.fingerprint_registered));
    setRecords(await a.json());
  }

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((r) => r.attendance_date === today);
  const checkedIn = todayRecords.filter((r) => r.check_in_time).length;
  const checkedOut = todayRecords.filter((r) => r.check_out_time).length;

  async function action(type: "check-in" | "check-out") {
    if (!employeeId) {
      setMessage("Select an employee.");
      setMsgType("error");
      return;
    }
    setBusy(true);
    setMessage("Scan fingerprint…");
    setMsgType("info");
    try {
      const optRes = await fetch("/api/webauthn/auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const opts = await optRes.json();
      if (!optRes.ok) throw new Error(opts.error);

      const auth = await startAuthentication({ optionsJSON: opts.options });
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type, employeeId, userId: opts.userId, authResponse: auth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      setMsgType("success");
      load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed");
      setMsgType("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Check-in and check-out with per-employee fingerprint verification"
        action={
          <button className="btn-outline text-sm" onClick={load}>
            Refresh
          </button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Enrolled employees" value={users.length} hint="Can use fingerprint check-in" />
        <StatCard label="Checked in today" value={checkedIn} accent="emerald" hint="Present on site" />
        <StatCard label="Checked out today" value={checkedOut} accent="amber" hint="Completed their shift" />
      </div>

      {message && (
        <p className={`mb-6 ${msgType === "success" ? "notice-success" : msgType === "error" ? "notice-error" : "notice-info"}`}>
          {message}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="panel">
          <div className="panel-header">
            <h2 className="text-sm font-medium">Record attendance</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Select employee, then verify with Windows Hello</p>
          </div>
          <div className="panel-body space-y-5">
            <div>
              <label className="field-label">Employee</label>
              <select className="field" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Select employee…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.employee_id}>
                    {u.employee_id} — {u.full_name}
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No enrolled employees yet. Add staff and scan fingerprints first.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={busy} className="btn-green py-3" onClick={() => action("check-in")}>
                {busy ? "Verifying…" : "Check in"}
              </button>
              <button disabled={busy} className="btn-amber py-3" onClick={() => action("check-out")}>
                {busy ? "Verifying…" : "Check out"}
              </button>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600">
              <p className="font-medium text-zinc-800">How verification works</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Only the enrolled fingerprint for the selected employee is accepted</li>
                <li>Wrong finger or another person&apos;s credential will be rejected</li>
                <li>Use Chrome or Edge on Windows with Hello configured</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Attendance history</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Recent check-in and check-out records</p>
            </div>
          </div>
          <div className="overflow-x-auto p-2">
            {records.length === 0 ? (
              <EmptyState title="No records yet" description="Record your first check-in to see history here." />
            ) : (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 20).map((r) => (
                    <tr key={r.id}>
                      <td>{r.attendance_date}</td>
                      <td className="font-medium text-zinc-900">{r.full_name}</td>
                      <td className="text-emerald-700">
                        {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : "—"}
                      </td>
                      <td>{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : "—"}</td>
                      <td className="tabular-nums">{r.work_hours ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
