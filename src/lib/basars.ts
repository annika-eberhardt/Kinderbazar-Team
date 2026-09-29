import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { BasarStatus } from "../types";

export const BASAR_STATUSES: BasarStatus[] = [
  "anmeldung_offen",
  "anmeldung_geschlossen",
  "laufend",
  "abgeschlossen",
];

export const BASAR_STATUS_LABELS: Record<BasarStatus, string> = {
  anmeldung_offen: "Anmeldephase offen",
  anmeldung_geschlossen: "Anmeldephase geschlossen",
  laufend: "Läuft",
  abgeschlossen: "Abgeschlossen",
};

/** Basar.datum is a plain yyyy-mm-dd date; EventItem.date is a full datetime-local string. */
export function eventDateOnly(eventDate: string) {
  return eventDate.slice(0, 10);
}

export function createBasar(input: {
  name: string;
  datum: string;
  eventId: string | null;
  createdBy: string;
}) {
  return addDoc(collection(db, "basars"), {
    name: input.name,
    datum: input.datum,
    eventId: input.eventId,
    status: "anmeldung_offen" satisfies BasarStatus,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  });
}

export function updateBasarMeta(
  basarId: string,
  input: { name: string; datum: string; eventId: string | null; status: BasarStatus },
) {
  return updateDoc(doc(db, "basars", basarId), input);
}

/**
 * Deletes the Basar and its Teilnahme-Bestätigungen. Verkäufernummern
 * themselves are permanent registrations independent of any one Basar, so
 * they are left untouched.
 */
export async function deleteBasar(basarId: string) {
  const teilnahmenSnap = await getDocs(
    query(collection(db, "basarTeilnahmen"), where("basarId", "==", basarId)),
  );
  const batch = writeBatch(db);
  teilnahmenSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "basars", basarId));
  await batch.commit();
}
