import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import RegisterForm from './RegisterForm';
import { fetchEventById } from '@/lib/event-api';

export const dynamic = 'force-dynamic';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString();
}

export default async function EventDetailPage({
  params
}: EventDetailPageProps) {
  const { eventId } = await params;
  const event = await fetchEventById(eventId);

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/events"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to events
        </Link>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-gray-900">
              {event.title}
            </h1>
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

          <p className="mt-4 text-gray-600">
            {event.description || 'No description available for this event.'}
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-500">Start</p>
              <p className="font-medium text-gray-900">
                {formatDate(event.startsAt)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-500">End</p>
              <p className="font-medium text-gray-900">
                {event.endsAt ? formatDate(event.endsAt) : 'TBA'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-500">Venue</p>
              <p className="font-medium text-gray-900">
                {event.venue || 'TBA'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-500">Capacity</p>
              <p className="font-medium text-gray-900">
                {event.capacity || 'Unlimited'}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Register for this event
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Current registrations: {event.registrations.length}
            </p>
            <div className="mt-4">
              <RegisterForm eventId={event.id} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
