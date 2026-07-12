'use client';

import React, { useState } from 'react';
import {
  useClubMembers,
  useAddClubMember,
  useRemoveClubMember,
  useAssignClubMemberRole,
  useRevokeClubMemberRole,
  useClubRoles,
  useMyClubPermissions
} from '@plugins/club/frontend/hooks';
import { ClubMember, Role } from '@plugins/club/frontend/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';

export function MembersManager({ clubId }: { clubId: string }) {
  const { data: members, isLoading: membersLoading } = useClubMembers(clubId);
  const { data: roles, isLoading: rolesLoading } = useClubRoles(clubId);
  const { user: currentUser } = useAuth();
  const { data: myPermissions, isLoading: permissionsLoading } =
    useMyClubPermissions(clubId);

  const addMemberMutation = useAddClubMember(clubId);
  const removeMemberMutation = useRemoveClubMember(clubId);
  const assignRoleMutation = useAssignClubMemberRole(clubId);
  const revokeRoleMutation = useRevokeClubMemberRole(clubId);

  const { toast } = useToast();

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('volunteer');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newRole) return;

    addMemberMutation.mutate(
      { email: newEmail, role: newRole },
      {
        onSuccess: () => {
          toast({ title: 'Success', description: 'Member added successfully' });
          setNewEmail('');
          setNewRole('volunteer');
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to add member',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const handleRemoveMember = (memberUserId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    removeMemberMutation.mutate(memberUserId, {
      onSuccess: () => {
        toast({ title: 'Removed', description: 'Member removed successfully' });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to remove member',
          variant: 'destructive'
        });
      }
    });
  };

  const handleRoleChange = (memberUserId: string, roleName: string) => {
    if (!roleName) return;
    assignRoleMutation.mutate(
      { memberUserId, roleName },
      {
        onSuccess: () => {
          toast({
            title: 'Role added',
            description: 'Member role added successfully'
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to add role',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const handleRevokeRole = (memberUserId: string, roleName: string) => {
    revokeRoleMutation.mutate(
      { memberUserId, roleName },
      {
        onSuccess: () => {
          toast({
            title: 'Role revoked',
            description: 'Member role revoked successfully'
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to revoke role',
            variant: 'destructive'
          });
        }
      }
    );
  };

  if (membersLoading || rolesLoading || permissionsLoading)
    return <div className="text-muted-foreground p-4">Loading members...</div>;

  return (
    <div className="space-y-8">
      {/* Add Member Form */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 md:p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Add New Member
        </h3>
        <form
          onSubmit={handleAddMember}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email
            </label>
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
              placeholder="john@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Role
            </label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((r: Role) => (
                  <SelectItem key={r.id || r._id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={addMemberMutation.isPending}
            className="w-full"
          >
            <UserPlus className="size-4 mr-2" /> Add
          </Button>
        </form>
      </div>

      {/* Members List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Current Members ({members?.length || 0})
        </h3>
        <div className="space-y-3">
          {members?.map((member: ClubMember) => {
            const memberRoles = member.roles || [];
            const roleNames = memberRoles.map((r) =>
              typeof r === 'string' ? r : r.name
            );

            let memberMaxHierarchy = -1;
            for (const r of memberRoles) {
              const roleObj =
                typeof r === 'string'
                  ? roles?.find((role: Role) => role.name === r)
                  : r;
              if (roleObj && roleObj.hierarchyLevel > memberMaxHierarchy) {
                memberMaxHierarchy = roleObj.hierarchyLevel;
              }
            }

            const isOwner = roleNames.includes('owner');
            const userIdStr =
              typeof member.userId === 'object'
                ? member.userId._id
                : member.userId;
            const isSelf =
              currentUser?.id === userIdStr ||
              (currentUser as any)?._id === userIdStr;

            const myMaxHierarchy = myPermissions?.isSuperAdmin
              ? Infinity
              : (myPermissions?.maxHierarchy ?? -1);

            const isDisabled =
              isOwner || isSelf || memberMaxHierarchy >= myMaxHierarchy;

            return (
              <div
                key={member.id || member._id}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-sm transition-colors ${isDisabled ? 'opacity-80' : 'hover:border-primary/30'}`}
              >
                <div>
                  <p className="font-medium text-foreground">
                    {typeof member.userId === 'object'
                      ? member.userId.name
                      : member.userId}
                    {isSelf && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                  {typeof member.userId === 'object' && (
                    <p className="text-sm text-muted-foreground">
                      {member.userId.email}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined:{' '}
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {roleNames.map((roleName) => (
                      <span
                        key={roleName}
                        className="inline-flex items-center gap-1 bg-muted border border-border px-2 py-1 rounded-md text-xs font-medium text-foreground"
                      >
                        {roleName}
                        {!isDisabled && (
                          <button
                            onClick={() =>
                              handleRevokeRole(userIdStr, roleName)
                            }
                            className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            title="Revoke role"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value=""
                      onValueChange={(val) => handleRoleChange(userIdStr, val)}
                      disabled={isDisabled}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Add role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          ?.filter((r: Role) => !roleNames.includes(r.name))
                          .map((r: Role) => (
                            <SelectItem key={r.id || r._id} value={r.name}>
                              {r.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent"
                      disabled={isDisabled}
                      onClick={() => handleRemoveMember(userIdStr)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {(!members || members.length === 0) && (
            <p className="text-sm text-muted-foreground p-8 text-center border rounded-xl border-dashed border-border/60">
              No members found in this club.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
