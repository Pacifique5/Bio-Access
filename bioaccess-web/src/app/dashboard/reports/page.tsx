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

export default function ReportsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("daily");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch(`/api/reports?type=${period}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data);
      toast(`Report generated with ${data.length} records.`, "success");
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
      [r.employee_id, r.full_name, r.department, r.attendance_date, r.check_in_time || "", r.check_out_time || "", r.work_hours ?? ""].join(",")
    );
    const blob = new Blob([[h.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${period}.csv`;
    a.click();
    toast("CSV downloaded successfully.", "success");
  }

  const totalHours = rows.reduce((sum, r) => sum + (r.work_hours ?? 0), 0);
  const uniqueEmployees = new Set(rows.map((r) => r.employee_id)).size;
  const periodLabel = period === "daily" ? "Today" : period === "weekly" ? "Last 7 days" : "This month";

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate attendance summaries and export data for payroll or compliance"
      />

      {rows.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Records" value={rows.length} hint={periodLabel} />
          <StatCard label="Employees" value={uniqueEmployees} accent="emerald" hint="With attendance data" />
          <StatCard label="Total hours" value={totalHours.toFixed(1)} accent="violet" hint="Across all records" />
        </div>
      )}

      <div className="panel">
        <div className="panel-header flex flex-wrap items-center gap-3">
          <select className="field w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="daily">Today</option>
            <option value="weekly">Last 7 days</option>
            <option value="monthly">This month</option>
          </select>
          <button className="btn-brand" onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Generate report"}
          </button>
          <button className="btn-outline" onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </button>
          {rows.length > 0 && (
            <span className="ml-auto text-xs text-zinc-400">{rows.length} rows · {periodLabel}</span>
          )}
        </div>
        <div className="overflow-x-auto p-2">
          {rows.length === 0 ? (
            <EmptyState
              title="No report generated"
              description="Choose a period and click Generate to preview attendance data."
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
                    <td>{r.attendance_date}</td>
                    <td>{r.check_in_time ? new Date(r.check_in_time).toLocaleString() : "—"}</td>
                    <td>{r.check_out_time ? new Date(r.check_out_time).toLocaleString() : "—"}</td>
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
