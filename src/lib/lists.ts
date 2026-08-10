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
import type { ListItem, SignupList } from "../types";

export function createList(input: {
  title: string;
  description: string;
  eventId: string | null;
  allowMemberAddItems: boolean;
  createdBy: string;
}) {
  return addDoc(collection(db, "lists"), {
    title: input.title,
    description: input.description,
    eventId: input.eventId,
    allowMemberAddItems: input.allowMemberAddItems,
    items: [],
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  });
}

export function updateListMeta(
  listId: string,
  input: Partial<
    Pick<SignupList, "title" | "description" | "eventId" | "allowMemberAddItems">
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
    };
    tx.update(ref, { items: [...items, item] });
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
  member: { uid: string; name: string },
) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "lists", listId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Liste nicht gefunden.");
    const items = (snap.data().items as ListItem[]) ?? [];
    const items2 = items.map((item) => {
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
    const items2 = items.map((item) =>
      item.id !== itemId
        ? item
        : { ...item, signups: item.signups.filter((s) => s.uid !== uid) },
    );
    tx.update(ref, { items: items2 });
  });
}

export async function addOwnListItem(
  listId: string,
  input: { label: string; member: { uid: string; name: string } },
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
    };
    tx.update(ref, { items: [...items, item] });
  });
}
