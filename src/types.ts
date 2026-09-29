export type Role = "admin" | "member";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string; // ISO datetime-local string
  location: string;
  createdBy: string;
  createdAt: number;
}

export interface ListSignup {
  uid: string;
  name: string;
}

export interface ListItem {
  id: string;
  label: string;
  capacity: number;
  signups: ListSignup[];
  waitlist: ListSignup[];
}

export interface SignupList {
  id: string;
  title: string;
  description: string;
  eventId: string | null;
  /** Admins can add predefined slots (label + capacity) to this list. */
  allowAdminSlots: boolean;
  /** Members can add their own free-text entries to this list. */
  allowMemberAddItems: boolean;
  /** Members can join a waitlist once a slot's capacity is reached. */
  enableWaitlist: boolean;
  items: ListItem[];
  createdBy: string;
  createdAt: number;
}

export type BasarStatus =
  | "anmeldung_offen"
  | "anmeldung_geschlossen"
  | "laufend"
  | "abgeschlossen";

export interface Basar {
  id: string;
  name: string;
  datum: string; // ISO date (yyyy-mm-dd)
  eventId: string | null;
  status: BasarStatus;
  createdBy: string;
  createdAt: number;
}

export type VerkaeufernummerStatus = "aktiv" | "storniert";

/**
 * A person's permanent registration for a Verkäufernummer. Independent of
 * any single Basar — the number stays theirs across events. Whether it's
 * actually in use at a given Basar is tracked separately via BasarTeilnahme.
 */
export interface Verkaeufernummer {
  id: string;
  nummer: number;
  vorname: string;
  nachname: string;
  kontakt: string;
  status: VerkaeufernummerStatus;
  vergebenVon: string;
  vergebenVonName: string;
  vergebenAm: number;
}

/** Confirms that a registered Verkäufernummer is participating in a specific Basar. */
export interface BasarTeilnahme {
  id: string;
  basarId: string;
  verkaeufernummerId: string;
  bestaetigtVon: string;
  bestaetigtVonName: string;
  bestaetigtAm: number;
}
