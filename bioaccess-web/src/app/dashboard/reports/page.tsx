"use client";

import { useState } from "react";

type ReportRow = {
  employee_id: string;
  full_name: string;
  department: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
};

export default function ReportsPage() {
  const [type, setType] = useState("daily");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [message, setMessage] = useState("");

  async function generate() {
    const r = await fetch(`/api/reports?type=${type}`);
    if (r.ok) setRows(await r.json());
    else setMessage("Failed to load report");
  }

  function exportCsv() {
    if (!rows.length) return;
    const headers = ["Employee ID", "Name", "Department", "Date", "Check In", "Check Out", "Hours"];
    const lines = rows.map((r) =>
      [
        r.employee_id,
        r.full_name,
        r.department,
        r.attendance_date,
        r.check_in_time || "",
        r.check_out_time || "",
        r.work_hours ?? "",
      ].join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bioaccess_${type}_${Date.now()}.csv`;
    a.click();
    setMessage("CSV exported");
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Reports</h2>
      {message && <p className="mb-4 text-sm text-slate-400">{message}</p>}

      <div className="card mb-6 flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button className="btn-primary" onClick={generate}>
          Generate
        </button>
        <button className="btn" onClick={exportCsv} disabled={!rows.length}>
          Export CSV
        </button>
      </div>

      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-slate-500">Generate a report to preview data</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Employee ID</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Department</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Check In</th>
                <th className="pb-2">Check Out</th>
                <th className="pb-2">Hours</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-700">
                  <td className="py-2">{r.employee_id}</td>
                  <td className="py-2">{r.full_name}</td>
                  <td className="py-2">{r.department}</td>
                  <td className="py-2">{r.attendance_date}</td>
                  <td className="py-2">{r.check_in_time ? new Date(r.check_in_time).toLocaleString() : "—"}</td>
                  <td className="py-2">{r.check_out_time ? new Date(r.check_out_time).toLocaleString() : "—"}</td>
                  <td className="py-2">{r.work_hours ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
