"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
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

const PERIODS = [
  { id: "daily", label: "Today", sub: "Current date" },
  { id: "weekly", label: "7 days", sub: "Recent history" },
  { id: "monthly", label: "This month", sub: "Full month" },
] as const;

function dateKey(value: string) {
  return value.slice(0, 10);
}

function formatTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function formatDate(value: string) {
  return new Date(dateKey(value) + "T12:00:00").toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function toHours(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function periodMeta(period: string) {
  const now = new Date();
  const today = now.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  const month = now.toLocaleDateString("en", { month: "long", year: "numeric" });

  if (period === "daily") return { label: "Today", range: today };
  if (period === "weekly") return { label: "Last 7 days", range: "Past week including today" };
  return { label: "This month", range: month };
}

function normalizeRows(data: Row[]): Row[] {
  return data.map((r) => ({
    ...r,
    work_hours: r.work_hours == null ? null : toHours(r.work_hours),
  }));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ReportStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent: "zinc" | "emerald" | "violet";
}) {
  const colors = {
    zinc: "bg-zinc-900",
    emerald: "bg-emerald-600",
    violet: "bg-violet-600",
  };
  const valueColors = {
    zinc: "text-zinc-900",
    emerald: "text-emerald-700",
    violet: "text-violet-700",
  };

  return (
    <div className="report-stat">
      <div className={`report-stat-accent ${colors[accent]}`} />
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${valueColors[accent]}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </div>
  );
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
  const avgHours = rows.length ? (totalHours / rows.length).toFixed(1) : "0.0";

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate attendance summaries and export payroll-ready data"
      />

      {/* Period + actions */}
      <div className="panel mb-6">
        <div className="panel-body">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">Report period</p>
              <p className="mt-0.5 text-xs text-zinc-500">Choose a range, then generate your summary</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    className={`period-pill text-left ${period === p.id ? "period-pill-active" : ""}`}
                  >
                    <span className="block font-semibold">{p.label}</span>
                    <span className={`block text-[10px] ${period === p.id ? "text-zinc-300" : "text-zinc-400"}`}>
                      {p.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-brand px-6" onClick={generate} disabled={loading}>
                {loading ? "Generating…" : "Generate report"}
              </button>
              <button className="btn-outline" onClick={exportCsv} disabled={!rows.length}>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {generated && rows.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportStat label="Records" value={rows.length} hint={meta.label} accent="zinc" />
          <ReportStat label="Employees" value={uniqueEmployees} hint="Unique staff" accent="emerald" />
          <ReportStat label="Total hours" value={totalHours.toFixed(1)} hint="Worked across period" accent="violet" />
          <ReportStat label="Avg per record" value={avgHours} hint="Hours per entry" accent="zinc" />
        </div>
      )}

      {/* Results */}
      <div className="panel overflow-hidden">
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Attendance report</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{meta.range}</p>
          </div>
          {generated && rows.length > 0 && (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {rows.length} row{rows.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="overflow-x-auto px-2 pb-2">
          {!generated ? (
            <EmptyState
              title="Ready to generate"
              description="Select Today, 7 days, or This month above, then click Generate report."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No records in this period"
              description={
                period === "daily"
                  ? "Today has no check-ins yet. Select 7 days to include yesterday's attendance."
                  : "No attendance records match the selected period."
              }
            />
          ) : (
            <table className="data-table w-full min-w-[720px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th className="text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.employee_id}-${r.attendance_date}-${i}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                          {initials(r.full_name)}
                        </span>
                        <div>
                          <p className="font-medium text-zinc-900">{r.full_name}</p>
                          <p className="font-mono text-[11px] text-zinc-400">{r.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-zinc-600">{r.department}</td>
                    <td className="whitespace-nowrap font-medium text-zinc-800">
                      {formatDate(r.attendance_date)}
                    </td>
                    <td>
                      {formatTime(r.check_in_time) ? (
                        <span className="badge-time-in">{formatTime(r.check_in_time)}</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td>
                      {formatTime(r.check_out_time) ? (
                        <span className="badge-time-out">{formatTime(r.check_out_time)}</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      {r.work_hours != null ? (
                        <span className="badge-hours">{toHours(r.work_hours).toFixed(2)}h</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
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
