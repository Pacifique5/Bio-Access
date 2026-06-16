"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

const EMPTY = { full_name: "", department: "", email: "", phone: "", role: "employee" };

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);

  async function load(q = "") {
    const url = q ? `/api/users?q=${encodeURIComponent(q)}` : "/api/users";
    setUsers(await (await fetch(url)).json());
  }

  useEffect(() => { load(); }, []);

  const enrolled = users.filter((u) => u.fingerprint_registered).length;
  const pending = users.length - enrolled;

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

  async function deleteUser(userId: number, name?: string) {
    if (!confirm(`Delete ${name || "this employee"}?`)) return;
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Failed to delete employee.", "error");
      return;
    }
    if (selectedId === userId) {
      setSelectedId(null);
      setForm(EMPTY);
    }
    toast(`${name || "Employee"} deleted successfully.`, "success");
    load(search);
  }

  async function registerFingerprint(userId: number) {
    setScanning(true);
    toast("Use Windows Hello fingerprint on this PC. If Chrome shows Google Password Manager, click “Save another way”.", "info");
    try {
      const optRes = await fetch("/api/webauthn/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const opts = await optRes.json();
      if (!optRes.ok) throw new Error(opts.error);

      const att = await startRegistration({ optionsJSON: opts, useAutoRegister: false });
      const verifyRes = await fetch("/api/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, response: att }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);

      toast("Fingerprint enrolled successfully.", "success");
      load(search);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Fingerprint registration failed", "error");
    } finally {
      setScanning(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedId) {
      const res = await fetch(`/api/users/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast("Failed to update employee.", "error");
        return;
      }
      toast("Employee updated successfully.", "success");
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
      toast(user.error || "Failed to create employee.", "error");
      return;
    }
    setSelectedId(user.id);
    toast(`Employee ${user.employee_id} created. Enroll fingerprint next.`, "success");
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
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600">
              <p className="font-medium text-zinc-800">Fingerprint enrollment tips</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Use Chrome or Edge on Windows with Windows Hello enabled</li>
                <li>If Google Password Manager appears, choose <strong>Save another way</strong> → <strong>This device</strong></li>
                <li>Microsoft Edge often goes straight to Windows Hello fingerprint</li>
              </ul>
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
                    onClick={() => {
                      const u = users.find((x) => x.id === selectedId);
                      deleteUser(selectedId, u?.full_name);
                    }}
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
                              toast(`Editing ${u.full_name}`, "info");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-red px-3 py-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUser(u.id, u.full_name);
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
