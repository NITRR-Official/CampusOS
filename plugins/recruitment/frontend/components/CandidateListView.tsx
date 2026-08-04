'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@campusos/design-system';
import { MoreHorizontal } from 'lucide-react';
import { Candidate, CandidateStatus } from './KanbanBoard';
import { useUpdateCandidateStatus } from '../hooks';

interface CandidateListViewProps {
  campaignId: string;
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
}

const statusColors: Record<
  CandidateStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  applied: 'secondary',
  shortlisted: 'default',
  interview: 'default',
  selected: 'default',
  rejected: 'destructive'
};

const STATUSES: CandidateStatus[] = [
  'applied',
  'shortlisted',
  'interview',
  'selected',
  'rejected'
];

export function CandidateListView({
  campaignId,
  candidates,
  onCandidateClick
}: CandidateListViewProps) {
  const updateStatusMutation = useUpdateCandidateStatus();

  const handleStatusChange = (
    e: React.MouseEvent,
    candidateId: string,
    newStatus: CandidateStatus
  ) => {
    e.stopPropagation(); // Prevent row click
    updateStatusMutation.mutate({ campaignId, candidateId, status: newStatus });
  };

  if (candidates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
        No candidates found for this campaign.
      </div>
    );
  }

  return (
    <div className="w-full bg-card border rounded-xl shadow-sm h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
          <TableRow>
            <TableHead className="pl-6">Candidate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow
              key={candidate._id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onCandidateClick(candidate)}
            >
              <TableCell className="font-medium pl-6">
                {candidate.name || `User ${candidate.userId.substring(0, 6)}`}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[candidate.status]}>
                  {candidate.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[300px] truncate">
                {candidate.notes || '-'}
              </TableCell>
              <TableCell className="text-right pr-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUSES.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        disabled={candidate.status === status}
                        onClick={(e: React.MouseEvent) =>
                          handleStatusChange(e, candidate._id, status)
                        }
                        className="cursor-pointer"
                      >
                        Move to {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
