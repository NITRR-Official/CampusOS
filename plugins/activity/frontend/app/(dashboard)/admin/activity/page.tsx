/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@campus-os/shared/api-client';
import { Skeleton } from '@campusos/design-system';

interface ActivityItem {
  id?: string;
  _id?: string;
  type?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  userId?: string;
  entityId?: string;
  targetId?: string;
  details?: Record<string, any>;
  themeColor?: string;
  timestamp: string;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivity() {
      try {
        const data = await apiClient.get<any>('/activity/global');
        if (Array.isArray(data)) {
          setActivities(data);
        } else if (data && Array.isArray(data.data)) {
          setActivities(data.data);
        } else {
          setActivities([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load activity log');
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          System Activity
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-time global activity feed across the platform.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="border border-border/50 rounded-md overflow-hidden bg-card/50 backdrop-blur-sm p-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity found.
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
            {activities.map((activity, index) => {
              const date = new Date(activity.timestamp);
              const entityType = String(
                activity.entityType ||
                  activity.type ||
                  activity.action?.split(':')[0] ||
                  '??'
              );

              // Use the themeColor injected by the backend plugin registry, or a generic fallback
              const colorClasses =
                activity.themeColor ||
                'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800';

              return (
                <div
                  key={activity.id || activity._id || index}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  {/* Icon */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${colorClasses}`}
                  >
                    <span className="text-xs font-bold uppercase">
                      {entityType.substring(0, 2)}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-md border border-border/50 bg-card/30 backdrop-blur-sm shadow-sm transition-all hover:bg-card/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm capitalize">
                        {String(activity.action || 'Unknown').replace('_', ' ')}
                      </div>
                      <time className="text-xs font-medium text-muted-foreground">
                        {date.toLocaleString()}
                      </time>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Actor: {activity.actorId || activity.userId || 'System'}{' '}
                      <br /> Target:{' '}
                      {activity.entityId || activity.targetId || 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
