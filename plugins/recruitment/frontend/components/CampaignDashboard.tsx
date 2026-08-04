'use client';

import React, { useState } from 'react';
import { Button, Input, Card, Label, Textarea } from '@campusos/design-system';
import { Plus, Users, Calendar } from 'lucide-react';
import { ExtensionPoint } from '@campus-os/shared/extension-point';
import { useCreateCampaign } from '../hooks';
import { Campaign } from '../api';

// Define a local type for form fields to avoid cross-plugin static dependencies
type FormField = any;

interface CampaignDashboardProps {
  entityType: string;
  entityId: string;
  campaigns: Campaign[];
  isLoading: boolean;
  onSelectCampaign: (id: string) => void;
}

export function CampaignDashboard({
  entityType,
  entityId,
  campaigns,
  isLoading,
  onSelectCampaign
}: CampaignDashboardProps) {
  const [isCreating, setIsCreating] = useState(false);

  // Campaign Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [onboardRoleName, setOnboardRoleName] = useState('volunteer');
  const [formFields, setFormFields] = useState<FormField[]>([]);

  const createMutation = useCreateCampaign(entityType, entityId);

  const handleSubmit = () => {
    createMutation.mutate(
      {
        title,
        description,
        onboardRoleName,
        formSchema: {
          title: `${title} Application Form`,
          description,
          fields: formFields
        }
      },
      {
        onSuccess: (data) => {
          setIsCreating(false);
          onSelectCampaign(data._id);
          // Reset form
          setTitle('');
          setDescription('');
          setFormFields([]);
        }
      }
    );
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Recruitment Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage club recruitment and onboard new members.
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="p-6 border-2 border-primary/20 bg-card/50">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Campaign Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fall 2026 Core Committee"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Onboard Target Role</Label>
                  <Input
                    value={onboardRoleName}
                    onChange={(e) => setOnboardRoleName(e.target.value)}
                    placeholder="e.g. volunteer"
                  />
                  <p className="text-xs text-muted-foreground">
                    The role automatically granted when selected.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the recruitment drive..."
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed">
              <h2 className="text-xl font-semibold mb-1">Application Form</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Build the form candidates will fill out to apply.
              </p>
              <ExtensionPoint
                id="forms:builder"
                context={{ initialFields: formFields, onChange: setFormFields }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title || formFields.length === 0}
              >
                Create Campaign
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              No recruitment campaigns active. Click 'New Campaign' to start
              one.
            </div>
          ) : (
            campaigns.map((campaign) => (
              <Card
                key={campaign._id}
                onClick={() => onSelectCampaign(campaign._id)}
                className="p-6 hover:shadow-md transition-all cursor-pointer group border-primary/20 hover:border-primary/50 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-2 h-full ${campaign.status === 'active' ? 'bg-primary/80' : 'bg-muted'}`}
                />
                <h3 className="font-semibold text-xl group-hover:text-primary transition-colors">
                  {campaign.title}
                </h3>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>View Candidates</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span className="capitalize">{campaign.status}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
