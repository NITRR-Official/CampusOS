'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import schedulingAPI from '@/lib/scheduling-api';

export default function EventSchedulePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [schedule, setSchedule] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchedule();
  }, [eventId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await schedulingAPI.getScheduleOverview(eventId);
      setSchedule(data);
      setConflicts(data.conflicts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading schedule...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Event Schedule</h1>

      {schedule && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Total Slots</p>
            <p className="text-2xl font-bold">{schedule.totalSlots}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Total Conflicts</p>
            <p className="text-2xl font-bold">{schedule.totalConflicts}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Resolved</p>
            <p className="text-2xl font-bold">{schedule.resolvedConflicts}</p>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Unresolved</p>
            <p className="text-2xl font-bold">{schedule.unresolvedConflicts}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Time Slots</h2>
        {schedule?.slots?.length > 0 ? (
          <div className="space-y-2">
            {schedule.slots.map(slot => (
              <div key={slot.id} className="border rounded p-3">
                <p className="font-semibold">{slot.venue}</p>
                <p className="text-sm text-gray-600">
                  {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No time slots scheduled</p>
        )}
      </div>

      {conflicts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-red-600">Conflicts Detected</h2>
          <div className="space-y-2">
            {conflicts.map(conflict => (
              <div key={conflict.id} className="border border-red-300 bg-red-50 rounded p-3">
                <p className="font-semibold">{conflict.description}</p>
                <p className="text-sm text-gray-600">Type: {conflict.conflictType}</p>
                <p className="text-sm">Status: {conflict.resolved ? 'Resolved' : 'Unresolved'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
