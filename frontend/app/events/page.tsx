import Link from 'next/link';
import MainLayout from '../components/MainLayout';
import { fetchEvents } from '@/lib/event-api';

export const dynamic = 'force-dynamic';

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleString();
}

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">Events</h1>
          <p className="text-lg text-gray-600">
            Explore upcoming events and register in one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              No events found yet.
            </div>
          ) : (
            events.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {event.title}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      event.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-600">
                  {event.description || 'No description available.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div>
                    <p className="font-semibold text-gray-700">Start</p>
                    <p>{formatDate(event.startsAt)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Venue</p>
                    <p>{event.venue || 'TBA'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Capacity</p>
                    <p>{event.capacity || 'Unlimited'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Registrations</p>
                    <p>{event.registrations.length}</p>
                  </div>
                </div>

                <Link
                  href={`/events/${event.id}`}
                  className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  View Details
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
