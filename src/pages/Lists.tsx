import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { createList } from "../lib/lists";
import type { EventItem, SignupList } from "../types";

const emptyForm = {
  title: "",
  description: "",
  eventId: "",
  allowMemberAddItems: true,
};

export function Lists() {
  const { profile, isAdmin } = useAuth();
  const { data: lists, loading } = useCollection<SignupList>("lists", "createdAt", "desc");
  const { data: events } = useCollection<EventItem>("events", "date", "asc");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    if (!form.title.trim()) {
      setError("Ein Titel ist erforderlich.");
      return;
    }
    setSaving(true);
    try {
      await createList({
        title: form.title.trim(),
        description: form.description.trim(),
        eventId: form.eventId || null,
        allowMemberAddItems: form.allowMemberAddItems,
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

  const eventTitleById = Object.fromEntries(events.map((e) => [e.id, e.title]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">Listen</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Neue Liste
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100"
        >
          <h2 className="font-semibold text-neutral-800">Neue Liste anlegen</h2>
          <input
            placeholder="Titel (z. B. Kuchenliste)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <textarea
            placeholder="Beschreibung"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            rows={2}
          />
          <select
            value={form.eventId}
            onChange={(e) => setForm({ ...form, eventId: e.target.value })}
            className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Keinem Termin zugeordnet</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={form.allowMemberAddItems}
              onChange={(e) =>
                setForm({ ...form, allowMemberAddItems: e.target.checked })
              }
              className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-300"
            />
            Mitglieder dürfen eigene Einträge hinzufügen (z. B. "Ich bringe Muffins")
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Speichert…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-neutral-500">Lädt…</p>
      ) : lists.length === 0 ? (
        <p className="text-neutral-500">Noch keine Listen angelegt.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lists.map((list) => {
            const totalSlots = list.items.reduce((sum, i) => sum + i.capacity, 0);
            const filledSlots = list.items.reduce((sum, i) => sum + i.signups.length, 0);
            return (
              <li key={list.id}>
                <Link
                  to={`/lists/${list.id}`}
                  className="block h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100 transition hover:ring-brand-300"
                >
                  <h3 className="font-semibold text-neutral-800">{list.title}</h3>
                  {list.eventId && eventTitleById[list.eventId] && (
                    <p className="mt-1 text-xs font-medium text-brand-600">
                      {eventTitleById[list.eventId]}
                    </p>
                  )}
                  {list.description && (
                    <p className="mt-2 text-sm text-neutral-600">{list.description}</p>
                  )}
                  <p className="mt-3 text-xs text-neutral-400">
                    {list.items.length === 0
                      ? "Noch keine Einträge"
                      : `${filledSlots} von ${totalSlots} Plätzen belegt`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
