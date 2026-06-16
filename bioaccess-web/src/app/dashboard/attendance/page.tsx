"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import type { AttendanceRecord, User } from "@/lib/types";

export default function AttendancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [uRes, aRes] = await Promise.all([fetch("/api/users"), fetch("/api/attendance")]);
    const allUsers = await uRes.json();
    setUsers(allUsers.filter((u: User) => u.fingerprint_registered));
    setRecords(await aRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function performAction(action: "check-in" | "check-out") {
    if (!employeeId) {
      setMessage("Select an employee first");
      return;
    }
    setLoading(true);
    setMessage("Verify fingerprint — only the registered employee can pass...");
    try {
      const optRes = await fetch("/api/webauthn/auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData.error);

      const authResp = await startAuthentication({ optionsJSON: optData.options });

      const attRes = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          employeeId,
          userId: optData.userId,
          authResponse: authResp,
        }),
      });
      const attData = await attRes.json();
      if (!attRes.ok) throw new Error(attData.error);

      setMessage(attData.message);
      load();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Attendance</h2>
      {message && (
        <p className="mb-4 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h3 className="font-semibold">Fingerprint Check-in / Out</h3>
          <p className="text-sm text-emerald-400">
            Each employee can only check in with their own registered fingerprint.
          </p>

          <div>
            <label className="label">Select Employee</label>
            <select
              className="input"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">— Choose employee —</option>
              {users.map((u) => (
                <option key={u.id} value={u.employee_id}>
                  {u.employee_id} – {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={loading}
            className="btn-success w-full"
            onClick={() => performAction("check-in")}
          >
            Check In (Fingerprint)
          </button>
          <button
            disabled={loading}
            className="btn-warning w-full"
            onClick={() => performAction("check-out")}
          >
            Check Out (Fingerprint)
          </button>

          <p className="text-xs text-slate-500">
            If someone else scans their finger, verification fails and attendance is not recorded.
          </p>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Attendance Records</h3>
            <button className="btn" onClick={load}>
              Refresh
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto text-sm">
            <table className="w-full text-left">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">In</th>
                  <th className="pb-2">Out</th>
                  <th className="pb-2">Hrs</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-slate-700">
                    <td className="py-2">{r.attendance_date}</td>
                    <td className="py-2">{r.full_name}</td>
                    <td className="py-2">
                      {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-2">
                      {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-2">{r.work_hours ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
