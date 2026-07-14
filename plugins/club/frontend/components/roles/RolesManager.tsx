'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Role } from '@plugins/club/frontend/api';
import {
  useClubRoles,
  useSystemPermissions,
  useDeleteRole,
  useUpdateRole
} from '@plugins/club/frontend/hooks';
import { RoleItem } from './RoleItem';
import { RoleEditorSheet } from './RoleEditorSheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RolesManager({ clubId }: { clubId: string }) {
  const { data: rolesData, isLoading: rolesLoading } = useClubRoles(clubId);
  const { data: permissions } = useSystemPermissions();
  const deleteRoleMutation = useDeleteRole(clubId);
  const updateRoleMutation = useUpdateRole(clubId);

  const [localRoles, setLocalRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { toast } = useToast();

  const loading = rolesLoading;

  useEffect(() => {
    if (rolesData) {
      setLocalRoles(
        [...rolesData].sort((a, b) => b.hierarchyLevel - a.hierarchyLevel)
      );
    }
  }, [rolesData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalRoles((items) => {
        const ownerRole = items.find((r) => r.name === 'owner');
        const sortableItems = items.filter((r) => r.name !== 'owner');

        const oldIndex = sortableItems.findIndex(
          (r) => (r.id || r._id) === active.id
        );
        const newIndex = sortableItems.findIndex(
          (r) => (r.id || r._id) === over.id
        );

        const newArray = arrayMove(sortableItems, oldIndex, newIndex);

        const updatedSortableRoles = newArray.map((r: Role, i: number) => {
          const newLevel = (newArray.length - i) * 10;
          if (r.hierarchyLevel !== newLevel) {
            updateRoleMutation.mutate(
              {
                roleId: (r.id || r._id) as string,
                payload: { hierarchyLevel: newLevel }
              },
              {
                onError: () => {
                  toast({
                    title: 'Error',
                    description: 'Failed to save hierarchy',
                    variant: 'destructive'
                  });
                }
              }
            );
          }
          return { ...r, hierarchyLevel: newLevel };
        });

        return ownerRole
          ? [ownerRole, ...updatedSortableRoles]
          : updatedSortableRoles;
      });
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsEditorOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (role.isTemplate) {
      toast({
        title: 'Not allowed',
        description: 'Template roles cannot be deleted',
        variant: 'destructive'
      });
      return;
    }

    deleteRoleMutation.mutate((role.id || role._id) as string, {
      onSuccess: () => {
        toast({ title: 'Deleted', description: 'Role deleted successfully' });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete role',
          variant: 'destructive'
        });
      }
    });
  };

  const handleCreateNew = () => {
    setEditingRole(null);
    setIsEditorOpen(true);
  };

  const onSaveComplete = async () => {
    setIsEditorOpen(false);
  };

  if (loading)
    return <div className="text-muted-foreground p-4">Loading roles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Roles & Teams</h2>
          <p className="text-sm text-muted-foreground">
            Members with roles higher in the list can manage roles lower in the
            list.
          </p>
        </div>
        <Button onClick={handleCreateNew} size="sm" className="gap-2">
          <Plus className="size-4" /> New Role
        </Button>
      </div>

      <div className="space-y-2 mb-2">
        {localRoles
          .filter((r) => r.name === 'owner')
          .map((role) => (
            <RoleItem
              key={(role.id || role._id) as string}
              role={role}
              onEdit={() => handleEdit(role)}
              onDelete={() => handleDelete(role)}
            />
          ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localRoles
            .filter((r) => r.name !== 'owner')
            .map((r) => (r.id || r._id) as string)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {localRoles
              .filter((r) => r.name !== 'owner')
              .map((role) => (
                <RoleItem
                  key={(role.id || role._id) as string}
                  role={role}
                  onEdit={() => handleEdit(role)}
                  onDelete={() => handleDelete(role)}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      <RoleEditorSheet
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        role={editingRole}
        clubId={clubId}
        allPermissions={permissions || []}
        onSaveComplete={onSaveComplete}
      />
    </div>
  );
}
