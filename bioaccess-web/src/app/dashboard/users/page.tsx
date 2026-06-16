"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

const emptyForm = {
  full_name: "",
  department: "",
  email: "",
  phone: "",
  role: "employee",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [registeringId, setRegisteringId] = useState<number | null>(null);

  async function load(q = "") {
    const url = q ? `/api/users?q=${encodeURIComponent(q)}` : "/api/users";
    const res = await fetch(url);
    setUsers(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (selectedId) {
      await fetch(`/api/users/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage("User updated");
    } else {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const user = await res.json();
      if (!res.ok) {
        setMessage(user.error);
        return;
      }
      setMessage(`User created: ${user.employee_id}. Now register their fingerprint.`);
      setSelectedId(user.id);
      await registerFingerprint(user.id);
    }
    load(search);
  }

  async function registerFingerprint(userId: number) {
    setRegisteringId(userId);
    setMessage("Place finger on scanner when Windows Hello prompts...");
    try {
      const optRes = await fetch("/api/webauthn/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData.error);

      const attResp = await startRegistration({ optionsJSON: optData });

      const verifyRes = await fetch("/api/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, response: attResp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error);

      setMessage("Fingerprint registered successfully for this employee.");
      load(search);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Fingerprint registration failed");
    } finally {
      setRegisteringId(null);
    }
  }

  async function deleteUser() {
    if (!selectedId || !confirm("Delete this user?")) return;
    await fetch(`/api/users/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    setForm(emptyForm);
    load(search);
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

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">User Management</h2>
      {message && (
        <p className="mb-4 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveUser} className="card space-y-3">
          <h3 className="font-semibold">{selectedId ? "Edit Employee" : "Register Employee"}</h3>
          {Object.entries({
            full_name: "Full Name",
            department: "Department",
            email: "Email",
            phone: "Phone",
          }).map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                className="input"
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key !== "phone"}
              />
            </div>
          ))}
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="employee">employee</option>
              <option value="manager">manager</option>
              <option value="student">student</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="btn-primary">
              {selectedId ? "Update" : "Save & Register Fingerprint"}
            </button>
            {selectedId && (
              <>
                <button
                  type="button"
                  className="btn-warning"
                  disabled={registeringId === selectedId}
                  onClick={() => registerFingerprint(selectedId)}
                >
                  {registeringId === selectedId ? "Scanning..." : "Re-register Fingerprint"}
                </button>
                <button type="button" className="btn-danger" onClick={deleteUser}>
                  Delete
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setSelectedId(null);
                    setForm(emptyForm);
                  }}
                >
                  Clear
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Each employee must scan their own fingerprint during registration. That fingerprint is
            tied to their account only.
          </p>
        </form>

        <div className="card">
          <div className="mb-4 flex gap-2">
            <input
              className="input"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-primary" onClick={() => load(search)}>
              Search
            </button>
            <button className="btn" onClick={() => { setSearch(""); load(); }}>
              All
            </button>
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Fingerprint</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className="cursor-pointer border-t border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="py-2">{u.employee_id}</td>
                    <td className="py-2">{u.full_name}</td>
                    <td className="py-2">
                      {u.fingerprint_registered ? (
                        <span className="text-emerald-400">Registered</span>
                      ) : (
                        <span className="text-amber-400">Pending</span>
                      )}
                    </td>
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
