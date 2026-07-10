'use client';

import Link from 'next/link';
import { useMyClubPermissions } from '@plugins/club/frontend/hooks';
import { useAuth } from '@/lib/auth-provider';

interface ClubActionButtonsProps {
  clubId: string;
  clubSlug: string;
}

export function ClubActionButtons({ clubId, clubSlug }: ClubActionButtonsProps) {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading } = useMyClubPermissions(isAuthenticated ? clubId : '');
  
  const canManage = data?.isSuperAdmin || 
    data?.permissions.includes('club:manage') || 
    data?.permissions.includes('administrator') || false;

  if (isLoading && isAuthenticated) {
    return (
      <div className="w-full md:w-auto flex shrink-0 gap-3">
        <div className="h-10 w-24 md:w-28 bg-secondary/50 animate-pulse rounded-xl" />
        <div className="h-10 w-24 md:w-28 bg-primary/20 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full md:w-auto flex shrink-0 gap-3">
      {canManage && (
        <Link
          href={`/clubs/${clubSlug}/settings`}
          className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/90 transition-all active:scale-95 border border-border"
        >
          Settings
        </Link>
      )}
      <button className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95">
        Join Club
      </button>
    </div>
  );
}
