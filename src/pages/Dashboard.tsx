import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { ListIcon, TagIcon } from "../components/icons";
import { formatTimeOnly, isSameDay } from "../lib/eventTime";
import type { Basar, BasarTeilnahme, EventItem, SignupList } from "../types";

export function Dashboard() {
  const { firebaseUser } = useAuth();
  // Lists, Basare and Verkäufernummern-Teilnahmen are member-only data, so
  // they're only fetched once someone is signed in — a guest just sees the
  // public events overview.
  const signedIn = !!firebaseUser;

  const { data: events, loading: eventsLoading } = useCollection<EventItem>(
    "events",
    "date",
    "asc",
  );
  const { data: lists, loading: listsLoading } = useCollection<SignupList>(
    "lists",
    "createdAt",
    "desc",
    undefined,
    signedIn,
  );
  const { data: basars, loading: basarsLoading } = useCollection<Basar>(
    "basars",
    "datum",
    "asc",
    undefined,
    signedIn,
  );
  const { data: teilnahmen, loading: teilnahmenLoading } = useCollection<BasarTeilnahme>(
    "basarTeilnahmen",
    undefined,
    "asc",
    undefined,
    signedIn,
  );

  const loading =
    eventsLoading || (signedIn && (listsLoading || basarsLoading || teilnahmenLoading));

  const now = Date.now();
  const upcoming = events
    .filter((ev) => new Date(ev.date).getTime() >= now - 1000 * 60 * 60 * 6)
    .slice(0, 6);

  const currentBasars = basars.filter((basar) => basar.status !== "abgeschlossen");

  const vergebeneNummernByBasarId: Record<string, number> = {};
  for (const t of teilnahmen) {
    vergebeneNummernByBasarId[t.basarId] = (vergebeneNummernByBasarId[t.basarId] ?? 0) + 1;
  }

  // Every event that's either coming up, or already has a list/current
  // Basar pointing at it — so nothing relevant silently drops off the page.
  const eventExists = new Set(events.map((e) => e.id));
  const relevantEventIds = new Set(upcoming.map((e) => e.id));
  for (const list of lists) if (list.eventId) relevantEventIds.add(list.eventId);
  for (const basar of currentBasars) if (basar.eventId) relevantEventIds.add(basar.eventId);

  const eventGroups = events
    .filter((ev) => relevantEventIds.has(ev.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((event) => ({
      event,
      lists: lists.filter((l) => l.eventId === event.id),
      basars: currentBasars.filter((b) => b.eventId === event.id),
    }));

  const unassignedLists = lists.filter((l) => !l.eventId || !eventExists.has(l.eventId));
  const unassignedBasars = currentBasars.filter((b) => !b.eventId || !eventExists.has(b.eventId));

  const isEmpty =
    eventGroups.length === 0 && unassignedLists.length === 0 && unassignedBasars.length === 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-800">Übersicht</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/events" className="text-brand-600 hover:underline">
            Alle Termine
          </Link>
          <Link to="/lists" className="text-brand-600 hover:underline">
            Alle Listen
          </Link>
          <Link to="/basare" className="text-brand-600 hover:underline">
            Alle Basare
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Lädt…</p>
      ) : isEmpty ? (
        <p className="rounded-3xl bg-white p-4 text-sm text-neutral-500 ring-1 ring-brand-100">
          Aktuell nichts Anstehendes.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventGroups.map(({ event, lists: eventLists, basars: eventBasars }) => (
            <div
              key={event.id}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100"
            >
              <Link to={`/events/${event.id}`} className="block">
                <p className="font-semibold text-neutral-800">{event.title}</p>
                <p className="text-sm text-brand-600">
                  {formatDate(event.date)}
                  {event.endDate
                    ? isSameDay(event.date, event.endDate)
                      ? `–${formatTimeOnly(event.endDate)}`
                      : ` – ${formatDate(event.endDate)}`
                    : ""}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
                {event.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">
                    {event.description}
                  </p>
                )}
              </Link>

              {eventLists.length === 0 && eventBasars.length === 0 ? (
                <p className="mt-2 text-xs text-neutral-500">
                  {signedIn
                    ? "Keine Liste oder kein Basar zugeordnet."
                    : "Melde dich an, um Listen und die Nummernvergabe zu sehen."}
                </p>
              ) : (
                <TileItems
                  lists={eventLists}
                  basars={eventBasars}
                  vergebeneNummernByBasarId={vergebeneNummernByBasarId}
                />
              )}
            </div>
          ))}

          {(unassignedLists.length > 0 || unassignedBasars.length > 0) && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <p className="font-semibold text-neutral-800">Ohne Termin</p>
              <TileItems
                lists={unassignedLists}
                basars={unassignedBasars}
                vergebeneNummernByBasarId={vergebeneNummernByBasarId}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TileItems({
  lists,
  basars,
  vergebeneNummernByBasarId,
}: {
  lists: SignupList[];
  basars: Basar[];
  vergebeneNummernByBasarId: Record<string, number>;
}) {
  return (
    <div className="mt-3 flex flex-col gap-4 border-t border-neutral-100 pt-3">
      {lists.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Listen
          </p>
          <ul className="flex flex-col gap-1.5">
            {lists.map((list) => {
              const filled = list.items.reduce((s, i) => s + i.signups.length, 0);
              const total = list.items.reduce((s, i) => s + i.capacity, 0);
              return (
                <li key={list.id}>
                  <Link
                    to={`/lists/${list.id}`}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <ListIcon className="h-4 w-4 shrink-0 text-brand-500" />
                    <span className="flex-1 break-words font-medium">{list.title}</span>
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                      {list.items.length === 0 ? "leer" : `${filled}/${total}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {basars.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Nummernvergabe
          </p>
          <ul className="flex flex-col gap-1.5">
            {basars.map((basar) => (
              <li key={basar.id}>
                <Link
                  to={`/basare/${basar.id}`}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                >
                  <TagIcon className="h-4 w-4 shrink-0 text-brand-500" />
                  <span className="flex-1 break-words font-medium">{basar.name}</span>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                    {vergebeneNummernByBasarId[basar.id] ?? 0} bestätigt
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
