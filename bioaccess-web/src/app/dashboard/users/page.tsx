"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

const EMPTY = { full_name: "", department: "", email: "", phone: "", role: "employee" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"info" | "success" | "error">("info");
  const [scanning, setScanning] = useState(false);

  async function load(q = "") {
    const url = q ? `/api/users?q=${encodeURIComponent(q)}` : "/api/users";
    setUsers(await (await fetch(url)).json());
  }

  useEffect(() => { load(); }, []);

  const enrolled = users.filter((u) => u.fingerprint_registered).length;
  const pending = users.length - enrolled;

  function notify(text: string, type: typeof msgType = "info") {
    setMessage(text);
    setMsgType(type);
  }

  function selectUser(u: User) {
    setSelectedId(u.id);
    setForm({
      full_name: u.full_name,
      department: u.department,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
    });
  }

  async function deleteUser(userId: number) {
    if (!confirm("Delete this employee?")) return;
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (selectedId === userId) {
      setSelectedId(null);
      setForm(EMPTY);
    }
    notify("Employee deleted.", "success");
    load(search);
  }

  async function registerFingerprint(userId: number) {
    setScanning(true);
    notify("Waiting for fingerprint scan…", "info");
    try {
      const optRes = await fetch("/api/webauthn/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const opts = await optRes.json();
      if (!optRes.ok) throw new Error(opts.error);

      const att = await startRegistration({ optionsJSON: opts });
      const verifyRes = await fetch("/api/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, response: att }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);

      notify("Fingerprint saved for this employee.", "success");
      load(search);
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : "Registration failed", "error");
    } finally {
      setScanning(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedId) {
      await fetch(`/api/users/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      notify("Employee updated.", "success");
      load(search);
      return;
    }

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const user = await res.json();
    if (!res.ok) {
      notify(user.error, "error");
      return;
    }
    setSelectedId(user.id);
    notify(`Created ${user.employee_id}. Scan fingerprint next.`, "info");
    await registerFingerprint(user.id);
    load(search);
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Register staff, manage profiles, and enroll fingerprints"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={users.length} />
        <StatCard label="Fingerprints enrolled" value={enrolled} accent="emerald" hint="Ready for check-in" />
        <StatCard label="Pending enrollment" value={pending} accent="amber" hint="Need fingerprint scan" />
      </div>

      {message && (
        <p className={`mb-6 ${msgType === "success" ? "notice-success" : msgType === "error" ? "notice-error" : "notice-info"}`}>
          {message}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <form onSubmit={onSubmit} className="panel lg:col-span-2">
          <div className="panel-header">
            <h2 className="text-sm font-medium">{selectedId ? "Edit employee" : "New employee"}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {selectedId ? "Update details or re-scan fingerprint" : "Create profile, then enroll fingerprint"}
            </p>
          </div>
          <div className="panel-body space-y-4">
            {(["full_name", "department", "email", "phone"] as const).map((key) => (
              <div key={key}>
                <label className="field-label">
                  {key === "full_name" ? "Full name" : key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  className="field"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={key !== "phone"}
                />
              </div>
            ))}
            <div>
              <label className="field-label">Role</label>
              <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className="btn-brand">
                {selectedId ? "Save changes" : "Create & scan finger"}
              </button>
              {selectedId && (
                <>
                  <button type="button" className="btn-outline" disabled={scanning} onClick={() => registerFingerprint(selectedId)}>
                    {scanning ? "Scanning…" : "Re-scan"}
                  </button>
                  <button
                    type="button"
                    className="btn-red"
                    onClick={() => deleteUser(selectedId)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </form>

        <div className="panel lg:col-span-3">
          <div className="panel-header flex flex-wrap items-center gap-2">
            <input
              className="field max-w-xs"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(search)}
            />
            <button className="btn-outline" onClick={() => load(search)}>Search</button>
            <span className="ml-auto text-xs text-zinc-400">{users.length} total</span>
          </div>
          <div className="overflow-x-auto p-2">
            {users.length === 0 ? (
              <EmptyState title="No employees yet" description="Create your first employee to get started." />
            ) : (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Fingerprint</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={`cursor-pointer ${selectedId === u.id ? "bg-zinc-100" : ""}`}
                      onClick={() => selectUser(u)}
                    >
                      <td className="font-mono text-xs">{u.employee_id}</td>
                      <td className="font-medium text-zinc-900">{u.full_name}</td>
                      <td>{u.department}</td>
                      <td className="capitalize">{u.role}</td>
                      <td>
                        <Badge variant={u.fingerprint_registered ? "success" : "warning"}>
                          {u.fingerprint_registered ? "Enrolled" : "Pending"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-outline px-3 py-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectUser(u);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-red px-3 py-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUser(u.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
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
