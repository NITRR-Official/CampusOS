/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Club {
  id: string;
  name: string;
  email: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  async function loadPendingClubs() {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/clubs?status=pending');
      if (response) {
        setClubs(response); // The club list endpoint just returns the array directly or wrapped?
        // Wait, depending on the endpoint structure. Assuming it returns the array directly based on typical REST or { success: true, data }
        // Let's handle both
        if (Array.isArray(response)) {
          setClubs(response);
        } else if (response.data && Array.isArray(response.data)) {
          setClubs(response.data);
        } else if (response.clubs && Array.isArray(response.clubs)) {
          setClubs(response.clubs);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load clubs',
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingClubs();
  }, []);

  async function handleStatusUpdate(
    clubId: string,
    status: 'approved' | 'rejected'
  ) {
    setActionLoading(clubId);
    try {
      // Endpoint is /api/v1/clubs/:clubId/approve or /reject
      const response = await apiClient.patch(
        `/clubs/${clubId}/${status === 'approved' ? 'approve' : 'reject'}`,
        {}
      );

      toast({
        title: `Club ${status}`,
        description: `The club has been successfully ${status}.`
      });

      // Remove from list
      setClubs(clubs.filter((c) => c.id !== clubId));
    } catch (err: any) {
      toast({
        title: 'Action failed',
        description: err.message || `Failed to ${status} the club.`,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Pending Clubs</h2>
        <p className="text-sm text-muted-foreground">
          Review and approve or reject club creation requests.
        </p>
      </div>

      <div className="border border-border/50 rounded-md overflow-hidden bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Club Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>Requested On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-[120px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : clubs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="size-8 text-green-500/50" />
                    <p>No pending club requests.</p>
                    <p className="text-xs">You're all caught up!</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clubs.map((club) => (
                <TableRow
                  key={club.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">{club.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{club.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {club.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {club.createdAt
                      ? new Date(club.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50"
                        disabled={actionLoading === club.id}
                        onClick={() => handleStatusUpdate(club.id, 'rejected')}
                      >
                        <XCircle className="size-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLoading === club.id}
                        onClick={() => handleStatusUpdate(club.id, 'approved')}
                      >
                        {actionLoading === club.id ? (
                          <Loader2 className="size-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4 mr-1" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
