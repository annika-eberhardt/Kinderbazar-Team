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
}

export interface SignupList {
  id: string;
  title: string;
  description: string;
  eventId: string | null;
  allowMemberAddItems: boolean;
  items: ListItem[];
  createdBy: string;
  createdAt: number;
}
