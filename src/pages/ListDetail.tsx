import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDocument } from "../hooks/useDocument";
import {
  addListItem,
  addOwnListItem,
  deleteList,
  joinListItem,
  leaveListItem,
  removeListItem,
} from "../lib/lists";
import type { SignupList } from "../types";

export function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { data: list, loading } = useDocument<SignupList>("lists", id);

  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState(1);
  const [ownLabel, setOwnLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <div>
      <button
        onClick={() => navigate("/lists")}
        className="mb-4 text-sm text-brand-600 hover:underline"
      >
        ← Zurück zu allen Listen
      </button>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{list.title}</h1>
          {list.description && (
            <p className="mt-1 text-neutral-600">{list.description}</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={handleDeleteList}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Liste löschen
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <ul className="mb-6 flex flex-col gap-3">
        {list.items.map((item) => {
          const joined = item.signups.some((s) => s.uid === profile.uid);
          const full = item.signups.length >= item.capacity;
          return (
            <li
              key={item.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-800">{item.label}</p>
                  <p className="text-xs text-neutral-400">
                    {item.signups.length} / {item.capacity} belegt
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {joined ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(() => leaveListItem(list.id, item.id, profile.uid))
                      }
                      className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-60"
                    >
                      Austragen
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
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40"
                    >
                      {full ? "Voll" : "Eintragen"}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      disabled={busy}
                      onClick={() => run(() => removeListItem(list.id, item.id))}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
              </div>
              {item.signups.length > 0 && (
                <p className="mt-2 text-sm text-neutral-500">
                  {item.signups.map((s) => s.name).join(", ")}
                </p>
              )}
            </li>
          );
        })}
        {list.items.length === 0 && (
          <p className="text-neutral-500">Noch keine Einträge in dieser Liste.</p>
        )}
      </ul>

      {isAdmin && (
        <form
          onSubmit={handleAddItem}
          className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Neuer Eintrag / Slot
            </label>
            <input
              placeholder="z. B. Kasse 10–12 Uhr"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
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
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            Hinzufügen
          </button>
        </form>
      )}

      {list.allowMemberAddItems && (
        <form
          onSubmit={handleAddOwnItem}
          className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Eigenen Eintrag hinzufügen
            </label>
            <input
              placeholder="z. B. Ich bringe Muffins"
              value={ownLabel}
              onChange={(e) => setOwnLabel(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            Eintragen
          </button>
        </form>
      )}
    </div>
  );
}
