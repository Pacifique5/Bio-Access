"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AttendanceRecord, User } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

function dateKey(value: string) {
  return value.slice(0, 10);
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [u, a] = await Promise.all([fetch("/api/users"), fetch("/api/attendance")]);
    if (!u.ok) {
      toast("Could not load employees.", "error");
      return;
    }
    const users = await u.json();
    if (!Array.isArray(users)) {
      toast("Could not load employees.", "error");
      return;
    }
    setAllUsers(users);
    if (a.ok) setRecords(await a.json());
  }

  useEffect(() => { load(); }, []);

  const enrolled = allUsers.filter((x) => x.fingerprint_registered);
  const pending = allUsers.length - enrolled.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((r) => dateKey(r.attendance_date) === today);
  const checkedIn = todayRecords.filter((r) => r.check_in_time).length;
  const checkedOut = todayRecords.filter((r) => r.check_out_time).length;
  const selected = allUsers.find((u) => u.employee_id === employeeId);

  async function action(type: "check-in" | "check-out") {
    if (!employeeId) {
      toast("Please select an employee first.", "warning");
      return;
    }
    if (selected && !selected.fingerprint_registered) {
      toast("This employee needs fingerprint enrollment first. Go to Employees → Re-scan.", "warning");
      return;
    }
    setBusy(true);
    toast("Scan fingerprint to verify…", "info");
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

      toast(data.message, "success");
      load();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Attendance action failed", "error");
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
          <button
            className="btn-outline text-sm"
            onClick={() => {
              load();
              toast("Attendance records refreshed.", "info");
            }}
          >
            Refresh
          </button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={allUsers.length} hint={`${enrolled.length} ready · ${pending} pending`} />
        <StatCard label="Checked in today" value={checkedIn} accent="emerald" hint="Present on site" />
        <StatCard label="Checked out today" value={checkedOut} accent="amber" hint="Completed their shift" />
      </div>

      {pending > 0 && (
        <div className="notice-info mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <strong>{pending}</strong> employee{pending > 1 ? "s" : ""} need fingerprint enrollment before check-in.
          </span>
          <Link href="/dashboard/users" className="text-sm font-medium underline">
            Enroll fingerprints →
          </Link>
        </div>
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
              {allUsers.length === 0 ? (
                <p className="text-sm text-zinc-500">No employees yet. Add staff from the Employees page.</p>
              ) : (
                <select className="field" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="">Select employee…</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.employee_id} disabled={!u.fingerprint_registered}>
                      {u.employee_id} — {u.full_name}
                      {u.fingerprint_registered ? "" : " (fingerprint pending)"}
                    </option>
                  ))}
                </select>
              )}
              {allUsers.length > 0 && enrolled.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  Employees exist but none have enrolled fingerprints yet. Open Employees, select each person, and click Re-scan.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={busy || enrolled.length === 0}
                className="btn-green py-3"
                onClick={() => action("check-in")}
              >
                {busy ? "Verifying…" : "Check in"}
              </button>
              <button
                disabled={busy || enrolled.length === 0}
                className="btn-amber py-3"
                onClick={() => action("check-out")}
              >
                {busy ? "Verifying…" : "Check out"}
              </button>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600">
              <p className="font-medium text-zinc-800">How verification works</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Only employees with enrolled fingerprints appear as selectable</li>
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
                      <td>{dateKey(r.attendance_date)}</td>
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
