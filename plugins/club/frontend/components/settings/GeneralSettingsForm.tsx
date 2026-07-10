'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface GeneralSettingsFormProps {
  clubId: string;
  initialData: {
    name: string;
    description: string;
    category: string;
    email: string;
  };
}

export function GeneralSettingsForm({
  clubId,
  initialData
}: GeneralSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/v1/clubs/${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update club');
      }

      toast({
        title: 'Settings updated',
        description: 'Club profile has been successfully updated.'
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not update club settings.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      !confirm(
        'Are you absolutely sure you want to archive this club? This action cannot be easily undone.'
      )
    )
      return;

    try {
      const response = await fetch(`/api/v1/clubs/${clubId}/archive`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to archive club');
      }

      toast({
        title: 'Club archived',
        description: 'The club has been moved to an inactive state.'
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          'Could not archive club. You might not have the Owner permission.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Club Profile
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update your club's public-facing details.
            </p>
          </div>

          <div className="grid gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="grid gap-2">
              <Label htmlFor="name">Club Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Branding
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your club's visual identity.
            </p>
          </div>

          <div className="grid gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="space-y-4">
              <Label>Club Logo</Label>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Button type="button" variant="outline" size="sm">
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 256x256px. PNG or JPEG.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Banner Image</Label>
              <div className="h-32 w-full rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
                <Upload className="size-6 text-muted-foreground" />
                <Button type="button" variant="outline" size="sm">
                  Upload Banner
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <div className="space-y-4 pt-10">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-destructive flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Irreversible and destructive actions.
          </p>
        </div>

        <div className="border border-destructive/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 bg-destructive/5 border-b border-destructive/20">
            <div>
              <h3 className="font-semibold text-foreground">
                Transfer Ownership
              </h3>
              <p className="text-sm text-muted-foreground">
                Give Admin access to another member of the club.
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Transfer Ownership
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 bg-destructive/5">
            <div>
              <h3 className="font-semibold text-foreground">Archive Club</h3>
              <p className="text-sm text-muted-foreground">
                Mark this club as inactive. Only the Owner can perform this
                action.
              </p>
            </div>
            <Button
              variant="destructive"
              className="shrink-0"
              onClick={handleArchive}
            >
              Archive Club
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
