import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { createBasar, eventDateOnly, BASAR_STATUS_LABELS } from "../lib/basars";
import type { Basar, EventItem } from "../types";

const emptyForm = { name: "", datum: "", eventId: "" };

export function Basare() {
  const { profile, isAdmin } = useAuth();
  const { data: basars, loading } = useCollection<Basar>("basars", "datum", "desc");
  const { data: events } = useCollection<EventItem>("events", "date", "asc");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedEvent = events.find((ev) => ev.id === form.eventId);
  const effectiveName = selectedEvent ? selectedEvent.title : form.name;
  const effectiveDatum = selectedEvent ? eventDateOnly(selectedEvent.date) : form.datum;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    if (!effectiveName.trim() || !effectiveDatum) {
      setError("Name und Datum sind erforderlich.");
      return;
    }
    setSaving(true);
    try {
      await createBasar({
        name: effectiveName.trim(),
        datum: effectiveDatum,
        eventId: form.eventId || null,
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

  const eventById = Object.fromEntries(events.map((e) => [e.id, e]));

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
          <select
            value={form.eventId}
            onChange={(e) => setForm({ ...form, eventId: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Keinem Termin zugeordnet</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Name (z. B. Herbstbasar 2026)"
            value={effectiveName}
            disabled={!!selectedEvent}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:bg-neutral-50 disabled:text-neutral-500"
          />
          <input
            type="date"
            value={effectiveDatum}
            disabled={!!selectedEvent}
            onChange={(e) => setForm({ ...form, datum: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:bg-neutral-50 disabled:text-neutral-500"
          />
          {selectedEvent && (
            <p className="text-xs text-neutral-400">
              Name und Datum werden automatisch aus dem Termin übernommen.
            </p>
          )}
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
          {basars.map((basar) => {
            const linkedEvent = basar.eventId ? eventById[basar.eventId] : undefined;
            const displayName = linkedEvent ? linkedEvent.title : basar.name;
            const displayDatum = linkedEvent ? eventDateOnly(linkedEvent.date) : basar.datum;
            return (
              <li key={basar.id}>
                <Link
                  to={`/basare/${basar.id}`}
                  className="block h-full rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100 transition hover:ring-brand-300"
                >
                  <h3 className="font-semibold text-neutral-800">{displayName}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{formatDate(displayDatum)}</p>
                  {linkedEvent && (
                    <p className="mt-1 text-xs font-medium text-brand-600">Termin verknüpft</p>
                  )}
                  <span className="mt-3 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                    {BASAR_STATUS_LABELS[basar.status]}
                  </span>
                </Link>
              </li>
            );
          })}
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
