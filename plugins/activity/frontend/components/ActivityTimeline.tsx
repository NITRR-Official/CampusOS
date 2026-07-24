import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@campus-os/shared/api-client';
import { Target, Users, Calendar, Settings, Activity } from 'lucide-react';

export function ActivityTimeline({ context }: { context?: any }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have an entity context (like clubId), fetch entity feed.
    // Otherwise fetch global feed.
    let url = `${API_BASE_URL}/activity/global`;
    if (context?.entityId) {
      url = `${API_BASE_URL}/activity/entity/${context.entityId}`;
    } else if (context?.personal) {
      url = `${API_BASE_URL}/activity/me`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // Only show top 5 on global dashboard for brevity
        const limited = context?.entityId ? data.data : data.data?.slice(0, 5);
        setActivities(limited || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch activity feed:', err);
        setLoading(false);
      });
  }, [context?.entityId, context?.personal]);

  if (loading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground p-4">
        Loading timeline...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-card/50 rounded-lg border border-border/50 text-center">
        No recent activity found in the system.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => {
        let Icon = Activity;
        let colorClass = 'bg-primary/10 text-primary';

        if (activity.entityType === 'club') {
          Icon = Target;
          colorClass = 'bg-orange-500/10 text-orange-500';
        } else if (activity.entityType === 'event') {
          Icon = Calendar;
          colorClass = 'bg-emerald-500/10 text-emerald-500';
        }

        if (activity.action.includes('member')) {
          Icon = Users;
          colorClass = 'bg-purple-500/10 text-purple-500';
        } else if (activity.action.includes('role')) {
          Icon = Settings;
          colorClass = 'bg-blue-500/10 text-blue-500';
        }

        // Pretty print action (e.g. 'club:member:added' -> 'Club Member Added')
        const actionTitle = activity.action
          .split(':')
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');

        return (
          <div
            key={activity._id || idx}
            className="flex gap-4 p-4 rounded-xl border border-border/40 bg-card/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
            >
              {React.createElement(Icon as any, { className: 'h-5 w-5' })}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none text-foreground">
                {actionTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary px-3 py-1 rounded-full h-fit self-center">
              {activity.entityType || 'System'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
