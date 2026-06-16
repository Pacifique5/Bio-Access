"use client";

import { useEffect, useState } from "react";
import type { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekly, setWeekly] = useState<{ date: string; count: number }[]>([]);
  const [logs, setLogs] = useState<{ action: string; timestamp: string }[]>([]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setWeekly(data.weekly);
        setLogs(data.logs);
      });
  }, []);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Dashboard</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: stats?.total_users, color: "text-brand-500" },
          { label: "Present Today", value: stats?.present_today, color: "text-emerald-400" },
          { label: "Absent Today", value: stats?.absent_today, color: "text-red-400" },
          { label: "Check-ins Today", value: stats?.checkins_today, color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-slate-400">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Weekly Attendance</h3>
          {weekly.length === 0 ? (
            <p className="text-slate-500">No data yet</p>
          ) : (
            <div className="space-y-2">
              {weekly.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-400">{d.date}</span>
                  <div className="h-3 flex-1 rounded bg-slate-700">
                    <div
                      className="h-3 rounded bg-brand-500"
                      style={{ width: `${Math.min(d.count * 20, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card max-h-80 overflow-y-auto">
          <h3 className="mb-4 font-semibold">Recent Activity</h3>
          {logs.map((l, i) => (
            <p key={i} className="border-b border-slate-700 py-2 text-sm text-slate-300">
              <span className="text-slate-500">
                [{new Date(l.timestamp).toLocaleString()}]
              </span>{" "}
              {l.action}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
