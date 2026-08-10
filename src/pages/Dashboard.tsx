import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useCollection";
import type { EventItem, SignupList } from "../types";

export function Dashboard() {
  const { profile } = useAuth();
  const { data: events, loading: eventsLoading } = useCollection<EventItem>(
    "events",
    "date",
    "asc",
  );
  const { data: lists, loading: listsLoading } = useCollection<SignupList>(
    "lists",
    "createdAt",
    "desc",
  );

  const now = Date.now();
  const upcoming = events
    .filter((ev) => new Date(ev.date).getTime() >= now - 1000 * 60 * 60 * 6)
    .slice(0, 5);

  const openLists = lists
    .filter((list) =>
      list.items.some((item) => item.signups.length < item.capacity),
    )
    .slice(0, 5);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-neutral-800">
        Willkommen, {profile?.name?.split(" ")[0]}! 👋
      </h1>
      <p className="mb-8 text-neutral-500">
        Hier ist der aktuelle Überblick für den Kinderbazar.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800">Nächste Termine</h2>
            <Link to="/events" className="text-sm text-brand-600 hover:underline">
              Alle ansehen
            </Link>
          </div>
          {eventsLoading ? (
            <p className="text-sm text-neutral-500">Lädt…</p>
          ) : upcoming.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-neutral-500 ring-1 ring-brand-100">
              Keine anstehenden Termine.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100"
                >
                  <p className="font-medium text-neutral-800">{ev.title}</p>
                  <p className="text-sm text-brand-600">{formatDate(ev.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800">Offene Listen</h2>
            <Link to="/lists" className="text-sm text-brand-600 hover:underline">
              Alle ansehen
            </Link>
          </div>
          {listsLoading ? (
            <p className="text-sm text-neutral-500">Lädt…</p>
          ) : openLists.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-neutral-500 ring-1 ring-brand-100">
              Aktuell keine offenen Plätze.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {openLists.map((list) => {
                const filled = list.items.reduce((s, i) => s + i.signups.length, 0);
                const total = list.items.reduce((s, i) => s + i.capacity, 0);
                return (
                  <li key={list.id}>
                    <Link
                      to={`/lists/${list.id}`}
                      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100 transition hover:ring-brand-300"
                    >
                      <p className="font-medium text-neutral-800">{list.title}</p>
                      <p className="text-sm text-neutral-500">
                        {filled} von {total} Plätzen belegt
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
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
