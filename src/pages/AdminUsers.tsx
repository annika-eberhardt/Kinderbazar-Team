import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { createMemberAccount } from "../lib/createMember";
import { friendlyAuthError } from "../lib/authErrors";
import type { Role, UserProfile } from "../types";

const emptyForm = { name: "", email: "", password: "", role: "member" as Role };

function randomPassword() {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4);
}

export function AdminUsers() {
  const { profile: currentProfile } = useAuth();
  const { data: users, loading } = useCollection<UserProfile>("users", "name", "asc");
  const [form, setForm] = useState({ ...emptyForm, password: randomPassword() });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError("Name, E-Mail und ein Passwort (mind. 6 Zeichen) sind erforderlich.");
      return;
    }
    setSaving(true);
    try {
      await createMemberAccount(form);
      setSuccess(
        `Konto für ${form.name.trim()} wurde angelegt. Anfangspasswort: ${form.password} (bitte sicher weitergeben, das Mitglied kann es später selbst ändern).`,
      );
      setForm({ ...emptyForm, password: randomPassword() });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleRole(user: UserProfile) {
    const nextRole: Role = user.role === "admin" ? "member" : "admin";
    if (
      user.uid === currentProfile?.uid &&
      nextRole === "member" &&
      !confirm("Du entziehst dir selbst die Admin-Rechte. Fortfahren?")
    ) {
      return;
    }
    await updateDoc(doc(db, "users", user.uid), { role: nextRole });
  }

  async function toggleActive(user: UserProfile) {
    if (
      user.uid === currentProfile?.uid &&
      user.active &&
      !confirm("Du deaktivierst dein eigenes Konto. Fortfahren?")
    ) {
      return;
    }
    await updateDoc(doc(db, "users", user.uid), { active: !user.active });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-800">Benutzerverwaltung</h1>

      <form
        onSubmit={handleCreate}
        className="mb-8 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100"
      >
        <h2 className="font-semibold text-neutral-800">Neues Konto anlegen</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <input
            type="email"
            placeholder="E-Mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <input
            placeholder="Anfangspasswort"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          >
            <option value="member">Mitglied</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{success}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Wird angelegt…" : "Konto anlegen"}
        </button>
      </form>

      <h2 className="mb-3 font-semibold text-neutral-800">Alle Mitglieder</h2>
      {loading ? (
        <p className="text-neutral-500">Lädt…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li
              key={user.uid}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-brand-100"
            >
              <div>
                <p className="font-medium text-neutral-800">
                  {user.name}{" "}
                  {!user.active && (
                    <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-normal text-neutral-500">
                      deaktiviert
                    </span>
                  )}
                </p>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.uid === currentProfile?.uid ? (
                  <Link
                    to="/konto"
                    className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    Mein Konto
                  </Link>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-brand-500 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Mitglied"}
                  </span>
                )}
                <button
                  onClick={() => toggleRole(user)}
                  className="rounded-xl px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100"
                >
                  {user.role === "admin" ? "Zu Mitglied machen" : "Zu Admin machen"}
                </button>
                <button
                  onClick={() => toggleActive(user)}
                  className="rounded-xl px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
                >
                  {user.active ? "Deaktivieren" : "Aktivieren"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
