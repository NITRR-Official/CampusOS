import React, { useState, useEffect } from 'react';
import { Role, SystemPermissionGroup } from '@plugins/club/frontend/api';
import { useCreateRole, useUpdateRole } from '@plugins/club/frontend/hooks';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface RoleEditorSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  clubId: string;
  allPermissions: SystemPermissionGroup[];
  onSaveComplete: () => void;
}

export function RoleEditorSheet({
  isOpen,
  onOpenChange,
  role,
  clubId,
  allPermissions,
  onSaveComplete
}: RoleEditorSheetProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#94a3b8');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const createRoleMutation = useCreateRole(clubId);
  const updateRoleMutation = useUpdateRole(clubId);

  useEffect(() => {
    if (isOpen) {
      setName(role?.name || '');
      setColor(role?.color || '#94a3b8');
      setSelectedPerms(new Set(role?.permissions || []));
    }
  }, [isOpen, role]);

  const togglePermission = (permId: string) => {
    const newSet = new Set(selectedPerms);
    if (newSet.has(permId)) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setSelectedPerms(newSet);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Role name is required',
        variant: 'destructive'
      });
      return;
    }

    const payload = {
      name,
      color,
      permissions: Array.from(selectedPerms)
    };

    if (role) {
      updateRoleMutation.mutate(
        { roleId: (role.id || role._id) as string, payload },
        {
          onSuccess: () => {
            toast({
              title: 'Success',
              description: 'Role updated successfully'
            });
            onSaveComplete();
          },
          onError: () => {
            toast({
              title: 'Error',
              description: 'Failed to save role',
              variant: 'destructive'
            });
          }
        }
      );
    } else {
      createRoleMutation.mutate(
        {
          ...payload,
          hierarchyLevel: 0,
          roleType: 'role'
        },
        {
          onSuccess: () => {
            toast({
              title: 'Success',
              description: 'Role created successfully'
            });
            onSaveComplete();
          },
          onError: () => {
            toast({
              title: 'Error',
              description: 'Failed to create role',
              variant: 'destructive'
            });
          }
        }
      );
    }
  };

  const saving = updateRoleMutation.isPending || createRoleMutation.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background border-l border-border p-0">
        <div className="p-6 pb-2 border-b border-border/50">
          <SheetHeader>
            <SheetTitle>{role ? 'Edit Role' : 'Create New Role'}</SheetTitle>
            <SheetDescription>
              Assign a name, color, and atomic permissions to this role.
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-6 p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Content Creator"
                  disabled={role?.name === 'owner'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-color">Role Color</Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    id="role-color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">
                Permissions
              </h3>

              {allPermissions.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No permissions loaded from system.
                </p>
              )}

              {allPermissions.map((group) => (
                <div key={group.module} className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {group.module} Module
                  </h4>
                  <div className="grid gap-3 bg-card p-3 rounded-xl border shadow-sm">
                    {group.permissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex flex-row items-start space-x-3"
                      >
                        <Checkbox
                          id={perm.id}
                          checked={selectedPerms.has(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          className="mt-1"
                          disabled={role?.name === 'owner'}
                        />
                        <div className="space-y-1 leading-none">
                          <label
                            htmlFor={perm.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border/50 bg-card mt-auto flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Role'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
