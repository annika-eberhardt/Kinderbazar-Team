import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseConfig } from "../firebase";
import type { Role } from "../types";

/**
 * Creates a new team member account without signing the current admin out.
 * Firebase Auth has no server-side notion of "who is allowed to sign up";
 * this uses a second, throwaway app instance so the admin's own session in
 * the primary app is left untouched while the new user is created.
 */
export async function createMemberAccount(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email.trim(),
      input.password,
    );
    await setDoc(doc(db, "users", credential.user.uid), {
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      active: true,
      createdAt: serverTimestamp(),
    });
    await signOut(secondaryAuth);
    return credential.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
