import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { PrintIcon } from "../components/icons";
import { printOrOpenPrintTab, useAutoPrint } from "../lib/print";
import {
  freigebeNummer,
  registriereVerkaeufernummer,
  storniereNummer,
  updateVerkaeufernummer,
} from "../lib/verkaeufernummern";
import type { Verkaeufernummer } from "../types";

const emptySellerForm = { vorname: "", nachname: "", kontakt: "" };

export function Nummernvergabe() {
  const { profile } = useAuth();
  const { data: nummern, loading } = useCollection<Verkaeufernummer>(
    "verkaeufernummern",
    "nummer",
    "asc",
  );
  useAutoPrint(!loading);

  const [sellerForm, setSellerForm] = useState(emptySellerForm);
  const [lastAssigned, setLastAssigned] = useState<{ nummer: number; name: string } | null>(
    null,
  );
  const [editingNummerId, setEditingNummerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ vorname: "", nachname: "", kontakt: "" });

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!profile) return null;

  const aktiveNummern = nummern
    .filter((n) => n.status === "aktiv")
    .sort((a, b) => a.nummer - b.nummer);
  const stornierteNummern = nummern
    .filter((n) => n.status === "storniert")
    .sort((a, b) => a.nummer - b.nummer);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    if (!sellerForm.vorname.trim() || !sellerForm.nachname.trim()) {
      setError("Vorname und Nachname sind erforderlich.");
      return;
    }
    setBusy(true);
    try {
      const nummer = await registriereVerkaeufernummer({
        vorname: sellerForm.vorname.trim(),
        nachname: sellerForm.nachname.trim(),
        kontakt: sellerForm.kontakt.trim(),
        vergebenVon: profile.uid,
        vergebenVonName: profile.name,
      });
      setLastAssigned({
        nummer,
        name: `${sellerForm.vorname.trim()} ${sellerForm.nachname.trim()}`,
      });
      setSellerForm(emptySellerForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nummer konnte nicht vergeben werden.");
    } finally {
      setBusy(false);
    }
  }

  function startEditNummer(n: Verkaeufernummer) {
    setEditForm({ vorname: n.vorname, nachname: n.nachname, kontakt: n.kontakt });
    setEditingNummerId(n.id);
  }

  async function handleSaveNummer(e: FormEvent, n: Verkaeufernummer) {
    e.preventDefault();
    if (!editForm.vorname.trim() || !editForm.nachname.trim()) return;
    setBusy(true);
    try {
      await updateVerkaeufernummer(n.id, {
        vorname: editForm.vorname.trim(),
        nachname: editForm.nachname.trim(),
        kontakt: editForm.kontakt.trim(),
      });
      setEditingNummerId(null);
    } catch {
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStornieren(n: Verkaeufernummer) {
    if (!confirm(`Nummer ${n.nummer} (${n.vorname} ${n.nachname}) wirklich stornieren?`)) return;
    setBusy(true);
    try {
      await storniereNummer(n.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleFreigeben(n: Verkaeufernummer) {
    if (
      !confirm(`Nummer ${n.nummer} wirklich freigeben? Sie wird danach für die nächste Registrierung verwendet.`)
    )
      return;
    setBusy(true);
    try {
      await freigebeNummer(n.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-neutral-800">Nummernvergabe</h1>
        <button
          onClick={printOrOpenPrintTab}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <PrintIcon className="h-4 w-4" />
          Drucken / PDF
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100 print:hidden">
        <h2 className="font-semibold text-neutral-800">Neue Verkäufernummer vergeben</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Vorname"
              value={sellerForm.vorname}
              onChange={(e) => setSellerForm({ ...sellerForm, vorname: e.target.value })}
              className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
            <input
              placeholder="Nachname"
              value={sellerForm.nachname}
              onChange={(e) => setSellerForm({ ...sellerForm, nachname: e.target.value })}
              className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <input
            placeholder="Kontakt (Telefon/E-Mail)"
            value={sellerForm.kontakt}
            onChange={(e) => setSellerForm({ ...sellerForm, kontakt: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? "Speichert…" : "Nummer vergeben"}
          </button>
        </form>

        {lastAssigned && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
            Nummer <span className="font-bold">{lastAssigned.nummer}</span> für{" "}
            {lastAssigned.name} vergeben.
          </p>
        )}
      </div>

      <h2 className="mb-3 font-semibold text-neutral-800">Verkäuferliste</h2>
      {loading ? (
        <p className="text-neutral-500">Lädt…</p>
      ) : aktiveNummern.length === 0 ? (
        <p className="text-neutral-500">Noch keine Nummern vergeben.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-brand-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs font-medium text-neutral-500">
                <th className="px-4 py-3">Nummer</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Kontakt</th>
                <th className="px-4 py-3 print:hidden">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {aktiveNummern.map((n) => {
                if (editingNummerId === n.id) {
                  return (
                    <tr key={n.id} className="border-b border-neutral-50 last:border-0">
                      <td className="px-4 py-3 font-semibold text-neutral-800">{n.nummer}</td>
                      <td colSpan={2} className="px-4 py-3">
                        <form
                          onSubmit={(e) => handleSaveNummer(e, n)}
                          className="flex flex-col gap-2 sm:flex-row sm:items-center"
                        >
                          <input
                            value={editForm.vorname}
                            onChange={(e) => setEditForm({ ...editForm, vorname: e.target.value })}
                            placeholder="Vorname"
                            className="rounded-xl border border-neutral-300 px-2 py-1.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                          />
                          <input
                            value={editForm.nachname}
                            onChange={(e) => setEditForm({ ...editForm, nachname: e.target.value })}
                            placeholder="Nachname"
                            className="rounded-xl border border-neutral-300 px-2 py-1.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                          />
                          <input
                            value={editForm.kontakt}
                            onChange={(e) => setEditForm({ ...editForm, kontakt: e.target.value })}
                            placeholder="Kontakt"
                            className="rounded-xl border border-neutral-300 px-2 py-1.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={busy}
                              className="rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                            >
                              Speichern
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNummerId(null)}
                              className="rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </form>
                      </td>
                      <td className="print:hidden" />
                    </tr>
                  );
                }

                return (
                  <tr key={n.id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-4 py-3 font-semibold text-neutral-800">{n.nummer}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {n.vorname} {n.nachname}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{n.kontakt || "—"}</td>
                    <td className="px-4 py-3 print:hidden">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={busy}
                          onClick={() => startEditNummer(n)}
                          className="rounded-xl px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100"
                        >
                          Bearbeiten
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleStornieren(n)}
                          className="rounded-xl px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          Nummer stornieren
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {stornierteNummern.length > 0 && (
        <div className="mt-6 print:hidden">
          <h2 className="mb-3 font-semibold text-neutral-800">Stornierte Nummern</h2>
          <ul className="flex flex-col gap-2">
            {stornierteNummern.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-brand-100"
              >
                <span className="text-neutral-600">
                  Nr. {n.nummer} – {n.vorname} {n.nachname}
                </span>
                <button
                  disabled={busy}
                  onClick={() => handleFreigeben(n)}
                  className="rounded-xl px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
                >
                  Nummer wieder freigeben
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
