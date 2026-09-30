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
  endDate: string; // ISO datetime-local string; empty if no end time was set
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

export type VerkaeufernummerStatus = "aktiv" | "storniert";

/** A person's registration for a Verkäufernummer — permanent until storniert. */
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
