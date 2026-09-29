import { useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { CalendarIcon } from "../components/icons";
import { downloadEventIcs } from "../lib/ics";
import type { EventItem } from "../types";

const emptyForm = { title: "", description: "", date: "", location: "" };
const PAST_GRACE_MS = 1000 * 60 * 60 * 6;

export function Events() {
  const { profile, isAdmin } = useAuth();
  const { data: events, loading } = useCollection<EventItem>("events", "date", "asc");
  const [showForm, setShowForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(ev: EventItem) {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description,
      date: ev.date,
      location: ev.location,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    if (!form.title.trim() || !form.date) {
      setError("Titel und Datum sind erforderlich.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "events", editingId), {
          title: form.title.trim(),
          description: form.description.trim(),
          date: form.date,
          location: form.location.trim(),
        });
      } else {
        await addDoc(collection(db, "events"), {
          title: form.title.trim(),
          description: form.description.trim(),
          date: form.date,
          location: form.location.trim(),
          createdBy: profile.uid,
          createdAt: serverTimestamp(),
        });
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Diesen Termin wirklich löschen?")) return;
    await deleteDoc(doc(db, "events", id));
  }

  const now = Date.now();
  const upcoming = events.filter(
    (ev) => new Date(ev.date).getTime() >= now - PAST_GRACE_MS,
  );
  const past = events
    .filter((ev) => new Date(ev.date).getTime() < now - PAST_GRACE_MS)
    .slice()
    .reverse();

  function renderEventCard(ev: EventItem, archived: boolean) {
    return (
      <li key={ev.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-neutral-800">{ev.title}</h3>
            <p className="mt-1 text-sm text-brand-600">
              {formatDate(ev.date)}
              {ev.location ? ` · ${ev.location}` : ""}
            </p>
            {ev.description && (
              <p className="mt-2 text-sm text-neutral-600">{ev.description}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {!archived && (
              <button
                onClick={() => downloadEventIcs(ev)}
                className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
              >
                <CalendarIcon className="h-4 w-4" />
                Zum Kalender hinzufügen
              </button>
            )}
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(ev)}
                  className="rounded-xl px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="rounded-xl px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">Termine</h1>
        {isAdmin && (
          <button
            onClick={startCreate}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600"
          >
            + Neuer Termin
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100"
        >
          <h2 className="font-semibold text-neutral-800">
            {editingId ? "Termin bearbeiten" : "Neuen Termin anlegen"}
          </h2>
          <input
            placeholder="Titel"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <textarea
            placeholder="Beschreibung"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            rows={2}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
            <input
              placeholder="Ort"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
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
      ) : upcoming.length === 0 ? (
        <p className="text-neutral-500">Keine anstehenden Termine.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {upcoming.map((ev) => renderEventCard(ev, false))}
        </ul>
      )}

      {!loading && past.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            {showArchive ? "Archiv ausblenden" : `Archiv anzeigen (${past.length})`}
          </button>
          {showArchive && (
            <ul className="mt-4 flex flex-col gap-3">
              {past.map((ev) => renderEventCard(ev, true))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
