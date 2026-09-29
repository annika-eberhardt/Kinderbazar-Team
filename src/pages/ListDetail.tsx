import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { useDocument } from "../hooks/useDocument";
import { PrintIcon } from "../components/icons";
import { printOrOpenPrintTab, useAutoPrint } from "../lib/print";
import {
  addListItem,
  addOwnListItem,
  deleteList,
  joinListItem,
  joinWaitlist,
  leaveListItem,
  leaveWaitlist,
  removeListItem,
  updateListItem,
  updateListMeta,
} from "../lib/lists";
import type { EventItem, ListItem, SignupList } from "../types";

export function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { data: list, loading } = useDocument<SignupList>("lists", id);
  const { data: events } = useCollection<EventItem>("events", "date", "asc");
  useAutoPrint(!loading && !!list);

  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState(1);
  const [ownLabel, setOwnLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({
    title: "",
    description: "",
    eventId: "",
    allowAdminSlots: true,
    allowMemberAddItems: true,
    enableWaitlist: false,
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ label: "", capacity: 1 });

  if (loading) return <p className="text-neutral-500">Lädt…</p>;
  if (!list) return <p className="text-neutral-500">Liste nicht gefunden.</p>;
  if (!profile) return null;

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function startEditMeta() {
    if (!list) return;
    setMetaForm({
      title: list.title,
      description: list.description,
      eventId: list.eventId ?? "",
      allowAdminSlots: list.allowAdminSlots ?? true,
      allowMemberAddItems: list.allowMemberAddItems,
      enableWaitlist: list.enableWaitlist ?? false,
    });
    setEditingMeta(true);
  }

  async function handleSaveMeta(e: FormEvent) {
    e.preventDefault();
    if (!list || !metaForm.title.trim()) return;
    if (!metaForm.allowAdminSlots && !metaForm.allowMemberAddItems) {
      setError("Wähle mindestens eine Art von Eintrag für die Liste aus.");
      return;
    }
    await run(async () => {
      await updateListMeta(list.id, {
        title: metaForm.title.trim(),
        description: metaForm.description.trim(),
        eventId: metaForm.eventId || null,
        allowAdminSlots: metaForm.allowAdminSlots,
        allowMemberAddItems: metaForm.allowMemberAddItems,
        enableWaitlist: metaForm.enableWaitlist,
      });
      setEditingMeta(false);
    });
  }

  function startEditItem(item: ListItem) {
    setItemForm({ label: item.label, capacity: item.capacity });
    setEditingItemId(item.id);
  }

  async function handleSaveItem(e: FormEvent) {
    e.preventDefault();
    if (!list || !editingItemId || !itemForm.label.trim()) return;
    await run(async () => {
      await updateListItem(list.id, editingItemId, {
        label: itemForm.label.trim(),
        capacity: itemForm.capacity,
      });
      setEditingItemId(null);
    });
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!newLabel.trim() || !list) return;
    await run(async () => {
      await addListItem(list.id, { label: newLabel.trim(), capacity: newCapacity });
      setNewLabel("");
      setNewCapacity(1);
    });
  }

  async function handleAddOwnItem(e: FormEvent) {
    e.preventDefault();
    if (!ownLabel.trim() || !list || !profile) return;
    await run(async () => {
      await addOwnListItem(list.id, {
        label: ownLabel.trim(),
        member: { uid: profile.uid, name: profile.name },
      });
      setOwnLabel("");
    });
  }

  async function handleDeleteList() {
    if (!list) return;
    if (!confirm("Diese Liste wirklich löschen?")) return;
    await deleteList(list.id);
    navigate("/lists");
  }

  const eventTitleById = Object.fromEntries(events.map((e) => [e.id, e.title]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate("/lists")}
          className="text-sm text-brand-600 hover:underline"
        >
          ← Zurück zu allen Listen
        </button>
        <button
          onClick={printOrOpenPrintTab}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <PrintIcon className="h-4 w-4" />
          Drucken / PDF
        </button>
      </div>

      {editingMeta ? (
        <form
          onSubmit={handleSaveMeta}
          className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100"
        >
          <h2 className="font-semibold text-neutral-800">Liste bearbeiten</h2>
          <input
            placeholder="Titel"
            value={metaForm.title}
            onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <textarea
            placeholder="Beschreibung"
            value={metaForm.description}
            onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            rows={2}
          />
          <select
            value={metaForm.eventId}
            onChange={(e) => setMetaForm({ ...metaForm, eventId: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Keinem Termin zugeordnet</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-2 rounded-xl bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500">
              Welche Art von Einträgen soll diese Liste haben?
            </p>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={metaForm.allowAdminSlots}
                onChange={(e) =>
                  setMetaForm({ ...metaForm, allowAdminSlots: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-300"
              />
              Vordefinierte Plätze/Slots durch Admins
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={metaForm.allowMemberAddItems}
                onChange={(e) =>
                  setMetaForm({ ...metaForm, allowMemberAddItems: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-300"
              />
              Mitglieder dürfen eigene Einträge hinzufügen
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={metaForm.enableWaitlist}
                onChange={(e) =>
                  setMetaForm({ ...metaForm, enableWaitlist: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-300"
              />
              Warteliste anbieten, wenn ein Platz voll ist
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setEditingMeta(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{list.title}</h1>
            {list.eventId && eventTitleById[list.eventId] && (
              <p className="mt-1 text-xs font-medium text-brand-600">
                {eventTitleById[list.eventId]}
              </p>
            )}
            {list.description && (
              <p className="mt-1 text-neutral-600">{list.description}</p>
            )}
          </div>
          {isAdmin && (
            <div className="flex shrink-0 gap-2 print:hidden">
              <button
                onClick={startEditMeta}
                className="rounded-xl px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-100"
              >
                Bearbeiten
              </button>
              <button
                onClick={handleDeleteList}
                className="rounded-xl px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Liste löschen
              </button>
            </div>
          )}
        </div>
      )}

      {error && !editingMeta && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 print:hidden">{error}</p>
      )}

      <ul className="mb-6 flex flex-col gap-3">
        {list.items.map((item) => {
          const waitlist = item.waitlist ?? [];
          const joined = item.signups.some((s) => s.uid === profile.uid);
          const onWaitlist = waitlist.some((s) => s.uid === profile.uid);
          const full = item.signups.length >= item.capacity;
          const waitlistEnabled = list.enableWaitlist ?? false;

          if (editingItemId === item.id) {
            return (
              <li
                key={item.id}
                className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100"
              >
                <form onSubmit={handleSaveItem} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      Bezeichnung
                    </label>
                    <input
                      value={itemForm.label}
                      onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      Plätze
                    </label>
                    <input
                      type="number"
                      min={item.signups.length || 1}
                      value={itemForm.capacity}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, capacity: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      Speichern
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItemId(null)}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </li>
            );
          }

          return (
            <li
              key={item.id}
              className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-800">{item.label}</p>
                  <p className="text-xs text-neutral-400">
                    {item.signups.length} / {item.capacity} belegt
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 print:hidden">
                  {joined ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(() => leaveListItem(list.id, item.id, profile.uid))
                      }
                      className="rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-60"
                    >
                      Austragen
                    </button>
                  ) : onWaitlist ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(() => leaveWaitlist(list.id, item.id, profile.uid))
                      }
                      className="rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-60"
                    >
                      Von Warteliste austragen
                    </button>
                  ) : full && waitlistEnabled ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          joinWaitlist(list.id, item.id, {
                            uid: profile.uid,
                            name: profile.name,
                          }),
                        )
                      }
                      className="rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-60"
                    >
                      Auf Warteliste
                    </button>
                  ) : (
                    <button
                      disabled={busy || full}
                      onClick={() =>
                        run(() =>
                          joinListItem(list.id, item.id, {
                            uid: profile.uid,
                            name: profile.name,
                          }),
                        )
                      }
                      className="rounded-xl bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40"
                    >
                      {full ? "Voll" : "Eintragen"}
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => startEditItem(item)}
                        className="rounded-xl px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100"
                      >
                        Bearbeiten
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => run(() => removeListItem(list.id, item.id))}
                        className="rounded-xl px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        Entfernen
                      </button>
                    </>
                  )}
                </div>
              </div>
              {item.signups.length > 0 && (
                <p className="mt-2 text-sm text-neutral-500">
                  {item.signups.map((s) => s.name).join(", ")}
                </p>
              )}
              {waitlist.length > 0 && (
                <p className="mt-1 text-sm text-neutral-400">
                  Warteliste: {waitlist.map((s) => s.name).join(", ")}
                </p>
              )}
            </li>
          );
        })}
        {list.items.length === 0 && (
          <p className="text-neutral-500">Noch keine Einträge in dieser Liste.</p>
        )}
      </ul>

      {isAdmin && (list.allowAdminSlots ?? true) && (
        <form
          onSubmit={handleAddItem}
          className="mb-4 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:flex-row sm:items-end print:hidden"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Neuer Eintrag / Slot
            </label>
            <input
              placeholder="z. B. Kasse 10–12 Uhr"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Plätze
            </label>
            <input
              type="number"
              min={1}
              value={newCapacity}
              onChange={(e) => setNewCapacity(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
          >
            Hinzufügen
          </button>
        </form>
      )}

      {list.allowMemberAddItems && (
        <form
          onSubmit={handleAddOwnItem}
          className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:flex-row sm:items-end print:hidden"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Eigenen Eintrag hinzufügen
            </label>
            <input
              placeholder="z. B. Ich bringe Muffins"
              value={ownLabel}
              onChange={(e) => setOwnLabel(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
          >
            Eintragen
          </button>
        </form>
      )}
    </div>
  );
}
