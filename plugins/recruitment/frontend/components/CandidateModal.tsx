'use client';

import React, { useState, useEffect } from 'react';
import { Candidate } from './KanbanBoard';
import { ExtensionPoint } from '@campus-os/shared/extension-point';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Textarea,
  Label,
  Button
} from '@campusos/design-system';

import {
  useFormSchema,
  useFormResponse,
  useUpdateCandidateNotes
} from '../hooks';

interface CandidateModalProps {
  candidate: Candidate | null;
  formId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function CandidateModal({
  candidate,
  formId,
  isOpen,
  onClose
}: CandidateModalProps) {
  const [notes, setNotes] = useState('');

  const { data: schemaData } = useFormSchema(formId);
  const { data: responseData, error } = useFormResponse(
    formId,
    candidate?.responseId
  );

  useEffect(() => {
    if (error) {
      console.error('Failed to load form response:', error);
    }
  }, [error]);

  const updateNotesMutation = useUpdateCandidateNotes();

  // Sync notes when candidate opens
  useEffect(() => {
    if (candidate) {
      setNotes(candidate.notes || '');
    }
  }, [candidate]);

  if (!candidate || !schemaData) return null;

  const handleSave = () => {
    updateNotesMutation.mutate({
      campaignId: candidate.campaignId,
      candidateId: candidate._id,
      notes
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Candidate Details</DialogTitle>
          <DialogDescription>
            Application review for{' '}
            {candidate.name || `User ${candidate.userId}`}. Current Status:{' '}
            <span className="font-semibold uppercase text-primary">
              {candidate.status}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
          {/* Left Column: Form Responses */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              Application Form
            </h3>
            <div className="pointer-events-none opacity-80 filter grayscale-[20%]">
              {/* We render it readonly by intercepting clicks with pointer-events-none */}
              <ExtensionPoint
                id="forms:renderer"
                context={{
                  schema: schemaData,
                  initialData: responseData?.answers,
                  onSubmit: () => {}
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Form is read-only.
            </p>
          </div>

          {/* Right Column: Recruiter Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              Recruiter Notes
            </h3>
            <div className="space-y-3">
              <Label htmlFor="notes">Internal Assessment</Label>
              <Textarea
                id="notes"
                placeholder="Enter interview notes, strengths, concerns..."
                className="min-h-[200px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button onClick={handleSave} className="w-full">
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
