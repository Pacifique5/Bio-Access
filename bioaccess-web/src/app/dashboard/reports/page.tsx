"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

type Row = {
  employee_id: string;
  full_name: string;
  department: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
};

function dateKey(value: string) {
  return value.slice(0, 10);
}

function toHours(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function periodMeta(period: string) {
  const now = new Date();
  const today = now.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  const month = now.toLocaleDateString("en", { month: "long", year: "numeric" });

  if (period === "daily") {
    return { label: "Today", hint: `Records from ${today} only` };
  }
  if (period === "weekly") {
    return { label: "Last 7 days", hint: "From 6 days ago through today" };
  }
  return { label: "This month", hint: `All records in ${month}` };
}

function normalizeRows(data: Row[]): Row[] {
  return data.map((r) => ({
    ...r,
    work_hours: r.work_hours == null ? null : toHours(r.work_hours),
  }));
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("daily");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch(`/api/reports?type=${period}`);
    if (res.ok) {
      const data = normalizeRows(await res.json());
      setRows(data);
      setGenerated(true);
      if (data.length === 0) {
        toast(
          period === "daily"
            ? "No attendance for today. Try Last 7 days for recent records."
            : "No records found for the selected period.",
          "warning"
        );
      } else {
        toast(`Report generated with ${data.length} record${data.length === 1 ? "" : "s"}.`, "success");
      }
    } else {
      toast("Could not load report.", "error");
    }
    setLoading(false);
  }

  function exportCsv() {
    if (!rows.length) {
      toast("Generate a report before exporting.", "warning");
      return;
    }
    const h = ["Employee ID", "Name", "Department", "Date", "Check In", "Check Out", "Hours"];
    const lines = rows.map((r) =>
      [
        r.employee_id,
        r.full_name,
        r.department,
        dateKey(r.attendance_date),
        r.check_in_time || "",
        r.check_out_time || "",
        r.work_hours ?? "",
      ].join(",")
    );
    const blob = new Blob([[h.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${period}.csv`;
    a.click();
    toast("CSV downloaded successfully.", "success");
  }

  const totalHours = rows.reduce((sum, r) => sum + toHours(r.work_hours), 0);
  const uniqueEmployees = new Set(rows.map((r) => r.employee_id)).size;
  const meta = periodMeta(period);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate attendance summaries and export data for payroll or compliance"
      />

      {generated && rows.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Records" value={rows.length} hint={meta.label} />
          <StatCard label="Employees" value={uniqueEmployees} accent="emerald" hint="With attendance data" />
          <StatCard label="Total hours" value={totalHours.toFixed(1)} accent="violet" hint="Across all records" />
        </div>
      )}

      <div className="panel">
        <div className="panel-header flex flex-wrap items-center gap-3">
          <div>
            <select className="field w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Today</option>
              <option value="weekly">Last 7 days</option>
              <option value="monthly">This month</option>
            </select>
            <p className="mt-1 text-xs text-zinc-500">{meta.hint}</p>
          </div>
          <button className="btn-brand" onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Generate report"}
          </button>
          <button className="btn-outline" onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </button>
          {generated && rows.length > 0 && (
            <span className="ml-auto text-xs text-zinc-400">{rows.length} rows · {meta.label}</span>
          )}
        </div>
        <div className="overflow-x-auto p-2">
          {!generated ? (
            <EmptyState
              title="No report generated"
              description="Select a time period, then click Generate report to preview attendance data."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No records in this period"
              description={
                period === "daily"
                  ? "Today has no check-ins yet. Select Last 7 days if you need yesterday's attendance."
                  : "No attendance records match the selected period."
              }
            />
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Hrs</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs">{r.employee_id}</td>
                    <td className="font-medium text-zinc-900">{r.full_name}</td>
                    <td>{r.department}</td>
                    <td>{dateKey(r.attendance_date)}</td>
                    <td>{r.check_in_time ? new Date(r.check_in_time).toLocaleString() : "—"}</td>
                    <td>{r.check_out_time ? new Date(r.check_out_time).toLocaleString() : "—"}</td>
                    <td className="tabular-nums">
                      {r.work_hours != null ? toHours(r.work_hours).toFixed(2) : "—"}
                    </td>
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
