import { collection, doc, runTransaction, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const COUNTER_REF = () => doc(db, "counters", "verkaeufernummern");

interface NummernCounter {
  nextNummer: number;
  freigegebeneNummern: number[];
}

/** Registers a new person and immediately assigns them the next free number. */
export async function registriereVerkaeufernummer(input: {
  vorname: string;
  nachname: string;
  kontakt: string;
  vergebenVon: string;
  vergebenVonName: string;
}): Promise<number> {
  return runTransaction(db, async (tx) => {
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

    return nummer;
  });
}

export function updateVerkaeufernummer(
  id: string,
  input: { vorname: string; nachname: string; kontakt: string },
) {
  return updateDoc(doc(db, "verkaeufernummern", id), input);
}

/** Permanently gives up a number. */
export function storniereNummer(id: string) {
  return updateDoc(doc(db, "verkaeufernummern", id), { status: "storniert" });
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
