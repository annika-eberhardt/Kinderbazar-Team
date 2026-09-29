import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
  type Transaction,
} from "firebase/firestore";
import { db } from "../firebase";

const COUNTER_REF = () => doc(db, "counters", "verkaeufernummern");

interface NummernCounter {
  nextNummer: number;
  freigegebeneNummern: number[];
}

async function registriereNummer(
  tx: Transaction,
  input: {
    vorname: string;
    nachname: string;
    kontakt: string;
    vergebenVon: string;
    vergebenVonName: string;
  },
) {
  const counterRef = COUNTER_REF();
  const counterSnap = await tx.get(counterRef);
  const counter = (counterSnap.data() as NummernCounter | undefined) ?? {
    nextNummer: 1,
    freigegebeneNummern: [],
  };

  const pool = counter.freigegebeneNummern ?? [];
  let nummer: number;
  let nextNummer = counter.nextNummer ?? 1;
  let restPool = pool;
  if (pool.length > 0) {
    nummer = Math.min(...pool);
    restPool = pool.filter((n) => n !== nummer);
  } else {
    nummer = nextNummer;
    nextNummer += 1;
  }

  const newRef = doc(collection(db, "verkaeufernummern"));
  tx.set(newRef, {
    nummer,
    vorname: input.vorname,
    nachname: input.nachname,
    kontakt: input.kontakt,
    status: "aktiv",
    vergebenVon: input.vergebenVon,
    vergebenVonName: input.vergebenVonName,
    vergebenAm: Date.now(),
  });
  tx.set(counterRef, { nextNummer, freigegebeneNummern: restPool });

  return { id: newRef.id, nummer };
}

/** Registers a brand-new person and immediately confirms them for the given Basar. */
export async function registriereUndBestaetige(
  basarId: string,
  input: {
    vorname: string;
    nachname: string;
    kontakt: string;
    vergebenVon: string;
    vergebenVonName: string;
  },
): Promise<number> {
  return runTransaction(db, async (tx) => {
    const { id, nummer } = await registriereNummer(tx, input);
    const teilnahmeRef = doc(collection(db, "basarTeilnahmen"));
    tx.set(teilnahmeRef, {
      basarId,
      verkaeufernummerId: id,
      bestaetigtVon: input.vergebenVon,
      bestaetigtVonName: input.vergebenVonName,
      bestaetigtAm: Date.now(),
    });
    return nummer;
  });
}

export function updateVerkaeufernummer(
  id: string,
  input: { vorname: string; nachname: string; kontakt: string },
) {
  return updateDoc(doc(db, "verkaeufernummern", id), input);
}

/** Permanently gives up a number: deactivates it and drops it from every Basar it was confirmed for. */
export async function storniereNummer(id: string) {
  const teilnahmenSnap = await getDocs(
    query(collection(db, "basarTeilnahmen"), where("verkaeufernummerId", "==", id)),
  );
  const batch = writeBatch(db);
  teilnahmenSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.update(doc(db, "verkaeufernummern", id), { status: "storniert" });
  await batch.commit();
}

/** Frees up a storniert number's digit so the next registration can reuse it. */
export async function freigebeNummer(verkaeufernummerId: string) {
  await runTransaction(db, async (tx) => {
    const numberRef = doc(db, "verkaeufernummern", verkaeufernummerId);
    const counterRef = COUNTER_REF();
    const numberSnap = await tx.get(numberRef);
    const counterSnap = await tx.get(counterRef);
    if (!numberSnap.exists()) throw new Error("Verkäufernummer nicht gefunden.");
    if (numberSnap.data().status !== "storniert") {
      throw new Error("Nur stornierte Nummern können freigegeben werden.");
    }
    const nummer = numberSnap.data().nummer as number;
    const counter = (counterSnap.data() as NummernCounter | undefined) ?? {
      nextNummer: 1,
      freigegebeneNummern: [],
    };
    const pool = counter.freigegebeneNummern ?? [];
    tx.delete(numberRef);
    if (!pool.includes(nummer)) {
      tx.set(counterRef, { ...counter, freigegebeneNummern: [...pool, nummer] });
    }
  });
}

/** Confirms an already-registered number for a specific Basar. */
export async function bestaetigeFuerBasar(
  basarId: string,
  verkaeufernummerId: string,
  input: { bestaetigtVon: string; bestaetigtVonName: string },
) {
  const existing = await getDocs(
    query(
      collection(db, "basarTeilnahmen"),
      where("basarId", "==", basarId),
      where("verkaeufernummerId", "==", verkaeufernummerId),
    ),
  );
  if (!existing.empty) return;
  await addDoc(collection(db, "basarTeilnahmen"), {
    basarId,
    verkaeufernummerId,
    bestaetigtVon: input.bestaetigtVon,
    bestaetigtVonName: input.bestaetigtVonName,
    bestaetigtAm: Date.now(),
  });
}

/** Un-confirms a number for one Basar without touching the permanent registration. */
export function entferneBestaetigung(teilnahmeId: string) {
  return deleteDoc(doc(db, "basarTeilnahmen", teilnahmeId));
}
