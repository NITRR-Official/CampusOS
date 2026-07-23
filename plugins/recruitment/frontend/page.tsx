'use client';

import React, { useState } from 'react';
import { CampaignDashboard } from './components/CampaignDashboard';
import { KanbanBoard, CandidateStatus } from './components/KanbanBoard';
import { CandidateListView } from './components/CandidateListView';
import { CandidateModal } from './components/CandidateModal';
import { Button } from '@campusos/design-system';
import { ArrowLeft, Loader2, LayoutGrid, List } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCampaigns, useCandidates } from './hooks';

export default function RecruitmentPage({
  entityId,
  entityType
}: {
  entityId: string;
  entityType: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation State from URL query
  const activeCampaignId = searchParams.get('campaign');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const setActiveCampaignId = (id: string | null) => {
    if (id) {
      router.push(`${pathname}?campaign=${id}`);
    } else {
      router.push(pathname);
    }
  };

  // Fetch Data
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useCampaigns(
    entityType,
    entityId
  );
  const { data: candidates = [], isLoading: isLoadingCandidates } =
    useCandidates(activeCampaignId);

  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // Handlers
  const handleCreateCampaign = (data: any) => {
    // Navigates into the newly created campaign (mock local state for now until data refreshes)
    // Actually, CampaignDashboard will handle creation, then we can select it
    if (data._id) {
      setActiveCampaignId(data._id);
    }
  };

  // Render Kanban Board if a campaign is active
  if (activeCampaignId) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background min-w-0 overflow-hidden -mx-5 -mt-5 -mb-20 md:-mx-8 md:-mt-8">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveCampaignId(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                Pipeline:{' '}
                {campaigns.find((c) => c._id === activeCampaignId)?.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage candidate statuses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="px-3"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden min-w-0 w-full bg-background/50">
          <div className="absolute inset-0 p-6 flex flex-col min-w-0 overflow-hidden">
            {isLoadingCandidates ? (
              <div className="flex-1 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                campaignId={activeCampaignId}
                candidates={candidates}
                onCandidateClick={setSelectedCandidate}
              />
            ) : (
              <CandidateListView
                campaignId={activeCampaignId}
                candidates={candidates}
                onCandidateClick={setSelectedCandidate}
              />
            )}
          </div>
        </main>

        <CandidateModal
          isOpen={!!selectedCandidate}
          candidate={selectedCandidate}
          formId={campaigns.find((c) => c._id === activeCampaignId)?.formId}
          onClose={() => setSelectedCandidate(null)}
        />
      </div>
    );
  }

  // Otherwise, render Campaign Dashboard
  return (
    <div className="flex flex-col min-h-0 bg-background w-full min-w-0">
      <CampaignDashboard
        entityType={entityType}
        entityId={entityId}
        campaigns={campaigns}
        isLoading={isLoadingCampaigns}
        onSelectCampaign={setActiveCampaignId}
      />
    </div>
  );
}
