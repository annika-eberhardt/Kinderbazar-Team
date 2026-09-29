import type { EventItem } from "../types";

const DEFAULT_DURATION_HOURS = 2;

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildEventIcs(event: EventItem) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kinderbazar Team//App//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@kinderbazar-team.web.app`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

export function downloadEventIcs(event: EventItem) {
  const ics = buildEventIcs(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^\w\-]+/g, "_") || "termin"}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
