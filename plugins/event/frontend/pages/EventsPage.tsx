import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@campusos/design-system';
import { fetchEvents, type EventItem } from '../api';
import { WorkspaceEventList } from '../components/WorkspaceEventList';

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export async function EventsPage({ clubId }: { clubId: string }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('campusos_access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let events: EventItem[] = [];
  let errorMsg: string | null = null;
  try {
    events = await fetchEvents({ clubId }, token);
  } catch (error: any) {
    console.error('Failed to fetch events:', error);
    errorMsg = error.message || error.toString();
    // If we get an error (e.g. 401 or 403), we can show an empty state or redirect
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 401
    ) {
      redirect('/login');
    }
  }

  if (errorMsg) {
    return (
      <div className="p-12 text-center text-red-500">
        <h2 className="text-2xl font-bold">Failed to load events</h2>
        <p className="mt-4">{errorMsg}</p>
      </div>
    );
  }

  return <WorkspaceEventList events={events} clubId={clubId} />;
}
