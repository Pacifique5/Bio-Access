"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardStats } from "@/lib/types";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";

type TodayRecord = {
  full_name: string;
  employee_id: string;
  department: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekly, setWeekly] = useState<{ date: string; count: number }[]>([]);
  const [logs, setLogs] = useState<{ action: string; timestamp: string }[]>([]);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [adminName, setAdminName] = useState("");
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setWeekly(data.weekly);
        setLogs(data.logs);
        setTodayRecords(data.todayRecords ?? []);
        setAdminName(data.adminName ?? "");
        setPending(data.pendingEnrollment ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const max = Math.max(...weekly.map((d) => d.count), 1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const kpis: { label: string; value: number | string | undefined; hint: string; accent?: "zinc" | "emerald" | "amber" | "violet" }[] = [
    {
      label: "Total employees",
      value: stats?.total_users,
      hint: `${stats?.enrolled_fingerprints ?? 0} fingerprints enrolled`,
    },
    {
      label: "Present today",
      value: stats?.present_today,
      hint: "Checked in successfully",
      accent: "emerald",
    },
    {
      label: "Absent today",
      value: stats?.absent_today,
      hint: "Not yet checked in",
      accent: "amber",
    },
    {
      label: "Attendance rate",
      value: stats?.attendance_rate != null ? `${stats.attendance_rate}%` : undefined,
      hint: "Of registered employees",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${greeting}${adminName ? `, ${adminName}` : ""}`}
        description="Here's what's happening with attendance today."
        action={
          <button onClick={load} className="btn-outline text-sm" disabled={loading}>
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
        }
      />

      {/* Alerts */}
      {pending > 0 && (
        <div className="notice-info mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <strong>{pending}</strong> employee{pending > 1 ? "s" : ""} still need fingerprint enrollment.
          </span>
          <Link href="/dashboard/users" className="text-sm font-medium underline">
            Complete enrollment →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} hint={k.hint} accent={k.accent} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/dashboard/users", label: "Add employee", sub: "Register & enroll fingerprint" },
          { href: "/dashboard/attendance", label: "Record attendance", sub: "Check-in or check-out" },
          { href: "/dashboard/reports", label: "View reports", sub: "Export attendance data" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="panel group p-5 transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <p className="font-medium text-zinc-900 group-hover:text-zinc-700">{a.label}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{a.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        {/* Chart */}
        <div className="panel xl:col-span-3">
          <div className="panel-header flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Weekly attendance</h2>
              <p className="text-xs text-zinc-500">Check-ins over the last 7 days</p>
            </div>
          </div>
          <div className="panel-body">
            {weekly.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
                No data yet — record your first check-in to see trends.
              </div>
            ) : (
              <div className="flex h-48 items-end gap-3">
                {weekly.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-medium tabular-nums text-zinc-700">{d.count}</span>
                    <div
                      className="w-full rounded-t-md bg-zinc-900 transition-all hover:bg-emerald-800"
                      style={{
                        height: `${Math.max((d.count / max) * 100, 4)}%`,
                      }}
                    />
                    <span className="text-[10px] font-medium text-zinc-400">
                      {new Date(d.date).toLocaleDateString("en", { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="panel xl:col-span-2">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-zinc-900">Recent activity</h2>
          </div>
          <div className="max-h-64 overflow-y-auto p-4">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {logs.map((l, i) => (
                  <li key={i} className="border-b border-zinc-50 pb-3 last:border-0">
                    <p className="text-sm text-zinc-800">{l.action}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {new Date(l.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Today's check-ins */}
      <div className="panel mt-6">
        <div className="panel-header flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Today&apos;s check-ins</h2>
            <p className="text-xs text-zinc-500">Employees who have checked in today</p>
          </div>
          <Link href="/dashboard/attendance" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
            Go to attendance →
          </Link>
        </div>
        <div className="overflow-x-auto px-2 pb-2">
          {todayRecords.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">
              No check-ins recorded today yet.
            </p>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <p className="font-medium text-zinc-900">{r.full_name}</p>
                      <p className="font-mono text-xs text-zinc-400">{r.employee_id}</p>
                    </td>
                    <td>{r.department}</td>
                    <td className="text-emerald-700">
                      {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : "—"}
                    </td>
                    <td>
                      {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : "—"}
                    </td>
                    <td className="tabular-nums">{r.work_hours ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
