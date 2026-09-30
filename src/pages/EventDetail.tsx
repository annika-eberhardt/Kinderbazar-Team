import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { useDocument } from "../hooks/useDocument";
import { CalendarIcon } from "../components/icons";
import { downloadEventIcs } from "../lib/ics";
import { formatTimeOnly, isSameDay } from "../lib/eventTime";
import { BASAR_STATUS_LABELS } from "../lib/basars";
import type { Basar, EventItem, SignupList } from "../types";

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { firebaseUser, isAdmin } = useAuth();
  // Lists and Basare are member-only data, so only fetch them once someone
  // is signed in — a guest just sees the public event details.
  const signedIn = !!firebaseUser;
  const { data: event, loading } = useDocument<EventItem>("events", id);
  const { data: linkedLists } = useCollection<SignupList>(
    "lists",
    undefined,
    "asc",
    ["eventId", "==", id],
    signedIn,
  );
  const { data: linkedBasars } = useCollection<Basar>(
    "basars",
    undefined,
    "asc",
    ["eventId", "==", id],
    signedIn,
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <p className="text-neutral-500">Lädt…</p>;
  if (!event) return <p className="text-neutral-500">Termin nicht gefunden.</p>;

  function startEdit() {
    if (!event) return;
    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate ?? "",
      location: event.location,
    });
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!event) return;
    setError(null);
    if (!form.title.trim() || !form.date) {
      setError("Titel und Datum sind erforderlich.");
      return;
    }
    if (form.endDate && form.endDate <= form.date) {
      setError("Die Endzeit muss nach der Startzeit liegen.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "events", event.id), {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        endDate: form.endDate,
        location: form.location.trim(),
      });
      setEditing(false);
    } catch {
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    if (!confirm("Diesen Termin wirklich löschen?")) return;
    await deleteDoc(doc(db, "events", event.id));
    navigate("/events");
  }

  return (
    <div>
      <button
        onClick={() => navigate("/events")}
        className="mb-4 text-sm text-brand-600 hover:underline print:hidden"
      >
        ← Zurück zu allen Terminen
      </button>

      {editing ? (
        <form
          onSubmit={handleSave}
          className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100"
        >
          <h2 className="font-semibold text-neutral-800">Termin bearbeiten</h2>
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
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Beginn
              </label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Ende (optional)
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
          <input
            placeholder="Ort"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">{event.title}</h1>
              <p className="mt-1 text-sm text-brand-600">
                {formatDate(event.date)}
                {event.endDate
                  ? isSameDay(event.date, event.endDate)
                    ? `–${formatTimeOnly(event.endDate)}`
                    : ` – ${formatDate(event.endDate)}`
                  : ""}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            {isAdmin && (
              <div className="flex shrink-0 gap-2 print:hidden">
                <button
                  onClick={startEdit}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-100"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-4 whitespace-pre-wrap text-neutral-600">{event.description}</p>
          )}

          <button
            onClick={() => downloadEventIcs(event)}
            className="mt-6 flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 print:hidden"
          >
            <CalendarIcon className="h-4 w-4" />
            Zum Kalender hinzufügen
          </button>

          {(linkedLists.length > 0 || linkedBasars.length > 0) && (
            <div className="mt-6 flex flex-col gap-4">
              {linkedLists.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-brand-500">
                    Verknüpfte Listen
                  </p>
                  <ul className="flex flex-col gap-2">
                    {linkedLists.map((list) => (
                      <li key={list.id}>
                        <Link
                          to={`/lists/${list.id}`}
                          className="block rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        >
                          {list.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {linkedBasars.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-brand-500">
                    Verknüpfte Basare
                  </p>
                  <ul className="flex flex-col gap-2">
                    {linkedBasars.map((basar) => (
                      <li key={basar.id}>
                        <Link
                          to={`/basare/${basar.id}`}
                          className="block rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        >
                          {basar.name}{" "}
                          <span className="text-neutral-400">
                            · {BASAR_STATUS_LABELS[basar.status]}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
