import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { useDocument } from "../hooks/useDocument";
import { PrintIcon } from "../components/icons";
import { printOrOpenPrintTab, useAutoPrint } from "../lib/print";
import {
  BASAR_STATUSES,
  BASAR_STATUS_LABELS,
  deleteBasar,
  eventDateOnly,
  updateBasarMeta,
} from "../lib/basars";
import {
  bestaetigeFuerBasar,
  entferneBestaetigung,
  freigebeNummer,
  registriereUndBestaetige,
  storniereNummer,
  updateVerkaeufernummer,
} from "../lib/verkaeufernummern";
import type { Basar, BasarStatus, BasarTeilnahme, EventItem, Verkaeufernummer } from "../types";

const emptySellerForm = { vorname: "", nachname: "", kontakt: "" };

export function BasarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { data: basar, loading } = useDocument<Basar>("basars", id);
  const { data: events } = useCollection<EventItem>("events", "date", "asc");
  const { data: nummern, loading: nummernLoading } = useCollection<Verkaeufernummer>(
    "verkaeufernummern",
    "nummer",
    "asc",
  );
  const { data: teilnahmen, loading: teilnahmenLoading } = useCollection<BasarTeilnahme>(
    "basarTeilnahmen",
    undefined,
    "asc",
    ["basarId", "==", id],
  );
  useAutoPrint(!loading && !nummernLoading && !teilnahmenLoading);

  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState<{
    name: string;
    datum: string;
    eventId: string;
    status: BasarStatus;
  }>({
    name: "",
    datum: "",
    eventId: "",
    status: "anmeldung_offen",
  });

  const [sellerForm, setSellerForm] = useState(emptySellerForm);
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [lastConfirmed, setLastConfirmed] = useState<{ nummer: number; name: string } | null>(
    null,
  );
  const [editingNummerId, setEditingNummerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ vorname: "", nachname: "", kontakt: "" });

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="text-neutral-500">Lädt…</p>;
  if (!basar) return <p className="text-neutral-500">Basar nicht gefunden.</p>;
  if (!profile) return null;

  const eventById = Object.fromEntries(events.map((e) => [e.id, e]));

  const selectedEvent = events.find((ev) => ev.id === metaForm.eventId);
  const effectiveName = selectedEvent ? selectedEvent.title : metaForm.name;
  const effectiveDatum = selectedEvent ? eventDateOnly(selectedEvent.date) : metaForm.datum;

  const linkedEvent = basar.eventId ? eventById[basar.eventId] : undefined;
  const displayName = linkedEvent ? linkedEvent.title : basar.name;
  const displayDatum = linkedEvent ? eventDateOnly(linkedEvent.date) : basar.datum;

  const aktiveNummern = nummern.filter((n) => n.status === "aktiv");
  const stornierteNummern = nummern.filter((n) => n.status === "storniert");
  const nummerById = Object.fromEntries(nummern.map((n) => [n.id, n]));

  const teilnahmenForBasar = teilnahmen.filter((t) => t.basarId === id);
  const confirmedIds = new Set(teilnahmenForBasar.map((t) => t.verkaeufernummerId));

  const confirmedRows = teilnahmenForBasar
    .map((teilnahme) => {
      const nummer = nummerById[teilnahme.verkaeufernummerId];
      return nummer ? { teilnahme, nummer } : null;
    })
    .filter((row): row is { teilnahme: BasarTeilnahme; nummer: Verkaeufernummer } => row !== null)
    .sort((a, b) => a.nummer.nummer - b.nummer.nummer);

  const unconfirmedAktive = aktiveNummern
    .filter((n) => !confirmedIds.has(n.id))
    .sort((a, b) => a.nummer - b.nummer);

  function startEditMeta() {
    if (!basar) return;
    setMetaForm({
      name: basar.name,
      datum: basar.datum,
      eventId: basar.eventId ?? "",
      status: basar.status,
    });
    setEditingMeta(true);
  }

  async function handleSaveMeta(e: FormEvent) {
    e.preventDefault();
    if (!basar || !effectiveName.trim() || !effectiveDatum) return;
    setError(null);
    setBusy(true);
    try {
      await updateBasarMeta(basar.id, {
        name: effectiveName.trim(),
        datum: effectiveDatum,
        eventId: metaForm.eventId || null,
        status: metaForm.status,
      });
      setEditingMeta(false);
    } catch {
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBasar() {
    if (!basar) return;
    if (
      !confirm(
        `Basar "${displayName}" wirklich löschen? Die Verkäufernummern selbst bleiben erhalten, nur die Bestätigungen für diesen Basar gehen verloren.`,
      )
    ) {
      return;
    }
    await deleteBasar(basar.id);
    navigate("/basare");
  }

  async function handleRegisterUndBestaetige(e: FormEvent) {
    e.preventDefault();
    if (!basar || !profile) return;
    setError(null);
    if (!sellerForm.vorname.trim() || !sellerForm.nachname.trim()) {
      setError("Vorname und Nachname sind erforderlich.");
      return;
    }
    setBusy(true);
    try {
      const nummer = await registriereUndBestaetige(basar.id, {
        vorname: sellerForm.vorname.trim(),
        nachname: sellerForm.nachname.trim(),
        kontakt: sellerForm.kontakt.trim(),
        vergebenVon: profile.uid,
        vergebenVonName: profile.name,
      });
      setLastConfirmed({
        nummer,
        name: `${sellerForm.vorname.trim()} ${sellerForm.nachname.trim()}`,
      });
      setSellerForm(emptySellerForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nummer konnte nicht registriert werden.");
    } finally {
      setBusy(false);
    }
  }

  async function handleBestaetigeExisting(e: FormEvent) {
    e.preventDefault();
    if (!basar || !profile || !selectedExistingId) return;
    const nummer = nummerById[selectedExistingId];
    if (!nummer) return;
    setError(null);
    setBusy(true);
    try {
      await bestaetigeFuerBasar(basar.id, selectedExistingId, {
        bestaetigtVon: profile.uid,
        bestaetigtVonName: profile.name,
      });
      setLastConfirmed({ nummer: nummer.nummer, name: `${nummer.vorname} ${nummer.nachname}` });
      setSelectedExistingId("");
    } catch {
      setError("Bestätigen fehlgeschlagen. Bitte versuche es erneut.");
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

  async function handleEntferneBestaetigung(teilnahme: BasarTeilnahme, n: Verkaeufernummer) {
    if (
      !confirm(
        `Nummer ${n.nummer} (${n.vorname} ${n.nachname}) für diesen Basar wieder entfernen? Die Nummer bleibt der Person weiterhin dauerhaft zugeordnet.`,
      )
    )
      return;
    setBusy(true);
    try {
      await entferneBestaetigung(teilnahme.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleStornieren(n: Verkaeufernummer) {
    if (
      !confirm(
        `Nummer ${n.nummer} (${n.vorname} ${n.nachname}) endgültig stornieren? Die Person verliert die Nummer dauerhaft, für alle Basare.`,
      )
    )
      return;
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
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate("/basare")}
          className="text-sm text-brand-600 hover:underline"
        >
          ← Zurück zu allen Basaren
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
          <h2 className="font-semibold text-neutral-800">Basar bearbeiten</h2>
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
          <input
            placeholder="Name"
            value={effectiveName}
            disabled={!!selectedEvent}
            onChange={(e) => setMetaForm({ ...metaForm, name: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:bg-neutral-50 disabled:text-neutral-500"
          />
          <input
            type="date"
            value={effectiveDatum}
            disabled={!!selectedEvent}
            onChange={(e) => setMetaForm({ ...metaForm, datum: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:bg-neutral-50 disabled:text-neutral-500"
          />
          {selectedEvent && (
            <p className="text-xs text-neutral-400">
              Name und Datum werden automatisch aus dem Termin übernommen.
            </p>
          )}
          <select
            value={metaForm.status}
            onChange={(e) => setMetaForm({ ...metaForm, status: e.target.value as BasarStatus })}
            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          >
            {BASAR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BASAR_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
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
            <h1 className="text-2xl font-bold text-neutral-800">{displayName}</h1>
            <p className="mt-1 text-sm text-neutral-500">{formatDate(displayDatum)}</p>
            {linkedEvent && (
              <p className="mt-1 text-xs font-medium text-brand-600">Termin verknüpft</p>
            )}
            <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              {BASAR_STATUS_LABELS[basar.status]}
            </span>
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
                onClick={handleDeleteBasar}
                className="rounded-xl px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Basar löschen
              </button>
            </div>
          )}
        </div>
      )}

      {error && !editingMeta && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 print:hidden">{error}</p>
      )}

      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100 print:hidden">
        <h2 className="font-semibold text-neutral-800">Nummer für diesen Basar bestätigen</h2>

        {unconfirmedAktive.length > 0 && (
          <form onSubmit={handleBestaetigeExisting} className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedExistingId}
              onChange={(e) => setSelectedExistingId(e.target.value)}
              className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Bereits registrierte Nummer auswählen…</option>
              {unconfirmedAktive.map((n) => (
                <option key={n.id} value={n.id}>
                  Nr. {n.nummer} – {n.vorname} {n.nachname}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy || !selectedExistingId}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
            >
              Bestätigen
            </button>
          </form>
        )}

        <form onSubmit={handleRegisterUndBestaetige} className="flex flex-col gap-3">
          <p className="text-xs font-medium text-neutral-500">
            Neue Person registrieren (bekommt eine neue, dauerhafte Nummer)
          </p>
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
          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
          >
            Neu registrieren & bestätigen
          </button>
        </form>

        {lastConfirmed && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
            Nummer <span className="font-bold">{lastConfirmed.nummer}</span> für {lastConfirmed.name}{" "}
            bestätigt.
          </p>
        )}
      </div>

      <h2 className="mb-3 font-semibold text-neutral-800">Verkäuferliste</h2>
      {teilnahmenLoading || nummernLoading ? (
        <p className="text-neutral-500">Lädt…</p>
      ) : confirmedRows.length === 0 ? (
        <p className="text-neutral-500">Noch niemand für diesen Basar bestätigt.</p>
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
              {confirmedRows.map(({ teilnahme, nummer: n }) => {
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
                          onClick={() => handleEntferneBestaetigung(teilnahme, n)}
                          className="rounded-xl px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
                        >
                          Für diesen Basar entfernen
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
            {stornierteNummern
              .sort((a, b) => a.nummer - b.nummer)
              .map((n) => (
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

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}
