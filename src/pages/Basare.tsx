import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { createBasar, BASAR_STATUS_LABELS } from "../lib/basars";
import type { Basar } from "../types";

const emptyForm = { name: "", datum: "" };

export function Basare() {
  const { profile, isAdmin } = useAuth();
  const { data: basars, loading } = useCollection<Basar>("basars", "datum", "desc");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    if (!form.name.trim() || !form.datum) {
      setError("Name und Datum sind erforderlich.");
      return;
    }
    setSaving(true);
    try {
      await createBasar({
        name: form.name.trim(),
        datum: form.datum,
        createdBy: profile.uid,
      });
      setShowForm(false);
      setForm(emptyForm);
    } catch {
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">Nummernvergabe</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600"
          >
            + Neuer Basar
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100"
        >
          <h2 className="font-semibold text-neutral-800">Neuen Basar anlegen</h2>
          <input
            placeholder="Name (z. B. Herbstbasar 2026)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <input
            type="date"
            value={form.datum}
            onChange={(e) => setForm({ ...form, datum: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Speichert…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-neutral-500">Lädt…</p>
      ) : basars.length === 0 ? (
        <p className="text-neutral-500">Noch keine Basare angelegt.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {basars.map((basar) => (
            <li key={basar.id}>
              <Link
                to={`/basare/${basar.id}`}
                className="block h-full rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100 transition hover:ring-brand-300"
              >
                <h3 className="font-semibold text-neutral-800">{basar.name}</h3>
                <p className="mt-1 text-sm text-neutral-500">{formatDate(basar.datum)}</p>
                <span className="mt-3 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {BASAR_STATUS_LABELS[basar.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}
