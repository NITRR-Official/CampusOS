'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUpdateCandidateStatus } from '../hooks';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@campusos/design-system';

export type CandidateStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'selected'
  | 'rejected';

export interface Candidate {
  _id: string;
  userId: string;
  responseId: string;
  campaignId: string;
  status: CandidateStatus;
  notes?: string;
  // We can include user details (name, avatar) if fetched
  name?: string;
}

const COLUMNS: { id: CandidateStatus; title: string }[] = [
  { id: 'applied', title: 'Applied' },
  { id: 'shortlisted', title: 'Shortlisted' },
  { id: 'interview', title: 'Interview' },
  { id: 'selected', title: 'Selected' },
  { id: 'rejected', title: 'Rejected' }
];

interface KanbanBoardProps {
  campaignId: string;
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
}

// --- Sortable Item Component ---
function SortableCandidateCard({
  candidate,
  onClick
}: {
  candidate: Candidate;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: candidate._id,
    data: { type: 'Candidate', candidate }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <Card className="p-4 cursor-grab active:cursor-grabbing hover:border-primary/50 bg-card transition-colors shadow-sm">
        <h4 className="font-medium text-sm">
          {candidate.name || `User ${candidate.userId.substring(0, 6)}`}
        </h4>
        {candidate.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {candidate.notes}
          </p>
        )}
      </Card>
    </div>
  );
}

// --- Main Board Component ---
export function KanbanBoard({
  campaignId,
  candidates: initialCandidates,
  onCandidateClick
}: KanbanBoardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(
    null
  );

  const updateStatusMutation = useUpdateCandidateStatus();

  // Sync state if initial candidates change from API
  useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnsData = useMemo(() => {
    const cols = {} as Record<CandidateStatus, Candidate[]>;
    COLUMNS.forEach((col) => {
      cols[col.id] = candidates.filter((c) => c.status === col.id);
    });
    return cols;
  }, [candidates]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const c = candidates.find((x) => x._id === active.id);
    if (c) setActiveCandidate(c);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCandidate(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCandidate = active.data.current?.type === 'Candidate';
    const isOverColumn = COLUMNS.find((c) => c.id === overId);

    if (!isActiveCandidate) return;

    // Moving between columns
    const candidate = candidates.find((c) => c._id === activeId);
    if (candidate) {
      let targetStatus = candidate.status;

      // If dropped directly on a column
      if (isOverColumn) {
        targetStatus = overId as CandidateStatus;
      } else {
        // Dropped on another candidate card
        const overCandidate = candidates.find((c) => c._id === overId);
        if (overCandidate) {
          targetStatus = overCandidate.status;
        }
      }

      if (candidate.status !== targetStatus) {
        // Optimistic UI Update
        setCandidates((prev) =>
          prev.map((c) =>
            c._id === activeId ? { ...c, status: targetStatus } : c
          )
        );
        // Call backend
        updateStatusMutation.mutate({
          campaignId,
          candidateId: activeId as string,
          status: targetStatus
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-0 items-start w-full min-w-0">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="flex-shrink-0 w-80 bg-muted/30 rounded-xl p-4 flex flex-col h-full border border-border/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h3>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                {columnsData[col.id].length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-1" id={col.id}>
              {/* Note: We assign the id of the column so it acts as a droppable area itself */}
              <SortableContext
                items={columnsData[col.id].map((c) => c._id)}
                strategy={verticalListSortingStrategy}
              >
                {columnsData[col.id].map((candidate) => (
                  <SortableCandidateCard
                    key={candidate._id}
                    candidate={candidate}
                    onClick={() => onCandidateClick(candidate)}
                  />
                ))}
              </SortableContext>
            </div>
          </div>
        ))}
      </div>

      {/* Drag Overlay for smooth animation while dragging */}
      <DragOverlay>
        {activeCandidate ? (
          <Card className="p-4 bg-card shadow-xl opacity-90 scale-105 cursor-grabbing">
            <h4 className="font-medium text-sm">
              {activeCandidate.name ||
                `User ${activeCandidate.userId.substring(0, 6)}`}
            </h4>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
