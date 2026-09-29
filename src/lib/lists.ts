import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ListItem, ListSignup, SignupList } from "../types";

export function createList(input: {
  title: string;
  description: string;
  eventId: string | null;
  allowAdminSlots: boolean;
  allowMemberAddItems: boolean;
  enableWaitlist: boolean;
  createdBy: string;
}) {
  return addDoc(collection(db, "lists"), {
    title: input.title,
    description: input.description,
    eventId: input.eventId,
    allowAdminSlots: input.allowAdminSlots,
    allowMemberAddItems: input.allowMemberAddItems,
    enableWaitlist: input.enableWaitlist,
    items: [],
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  });
}

export function updateListMeta(
  listId: string,
  input: Partial<
    Pick<
      SignupList,
      | "title"
      | "description"
      | "eventId"
      | "allowAdminSlots"
      | "allowMemberAddItems"
      | "enableWaitlist"
    >
  >,
) {
  return updateDoc(doc(db, "lists", listId), input);
}

export function deleteList(listId: string) {
  return deleteDoc(doc(db, "lists", listId));
}

function newItemId() {
  return crypto.randomUUID();
}

function withDefaults(item: ListItem): ListItem {
  return { ...item, waitlist: item.waitlist ?? [] };
}

export async function addListItem(
  listId: string,
  input: { label: string; capacity: number },
) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const item: ListItem = {
      id: newItemId(),
      label: input.label,
      capacity: input.capacity,
      signups: [],
      waitlist: [],
    };
    tx.update(ref, { items: [...items, item] });
  });
}

export async function updateListItem(
  listId: string,
  itemId: string,
  input: { label: string; capacity: number },
) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const items2 = items.map((item) => {
      if (item.id !== itemId) return item;
      if (input.capacity < item.signups.length) {
        throw new Error(
          `Die Platzzahl kann nicht unter ${item.signups.length} (bereits eingetragen) gesenkt werden.`,
        );
      }
      return { ...withDefaults(item), label: input.label, capacity: input.capacity };
    });
    tx.update(ref, { items: items2 });
  });
}

export async function removeListItem(listId: string, itemId: string) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    tx.update(ref, { items: items.filter((i) => i.id !== itemId) });
  });
}

export async function joinListItem(
  listId: string,
  itemId: string,
  member: ListSignup,
) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const items2 = items.map((raw) => {
      const item = withDefaults(raw);
      if (item.id !== itemId) return item;
      if (item.signups.some((s) => s.uid === member.uid)) return item;
      if (item.signups.length >= item.capacity) {
        throw new Error("Dieser Eintrag ist bereits voll.");
      }
      return { ...item, signups: [...item.signups, member] };
    });
    tx.update(ref, { items: items2 });
  });
}

export async function leaveListItem(listId: string, itemId: string, uid: string) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const items2 = items.map((raw) => {
      const item = withDefaults(raw);
      if (item.id !== itemId) return item;
      const signups = item.signups.filter((s) => s.uid !== uid);
      // Promote the next person on the waitlist into the freed-up spot.
      if (signups.length < item.capacity && item.waitlist.length > 0) {
        const [promoted, ...restWaitlist] = item.waitlist;
        return { ...item, signups: [...signups, promoted], waitlist: restWaitlist };
      }
      return { ...item, signups };
    });
    tx.update(ref, { items: items2 });
  });
}

export async function joinWaitlist(listId: string, itemId: string, member: ListSignup) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const items2 = items.map((raw) => {
      const item = withDefaults(raw);
      if (item.id !== itemId) return item;
      if (item.signups.length < item.capacity) {
        throw new Error("Es ist noch ein Platz frei, du kannst dich direkt eintragen.");
      }
      if (
        item.signups.some((s) => s.uid === member.uid) ||
        item.waitlist.some((s) => s.uid === member.uid)
      ) {
        return item;
      }
      return { ...item, waitlist: [...item.waitlist, member] };
    });
    tx.update(ref, { items: items2 });
  });
}

export async function leaveWaitlist(listId: string, itemId: string, uid: string) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const items2 = items.map((raw) => {
      const item = withDefaults(raw);
      if (item.id !== itemId) return item;
      return { ...item, waitlist: item.waitlist.filter((s) => s.uid !== uid) };
    });
    tx.update(ref, { items: items2 });
  });
}

export async function addOwnListItem(
  listId: string,
  input: { label: string; member: ListSignup },
) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const item: ListItem = {
      id: newItemId(),
      label: input.label,
      capacity: 1,
      signups: [input.member],
      waitlist: [],
    };
    tx.update(ref, { items: [...items, item] });
  });
}
