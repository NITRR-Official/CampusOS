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
import {
  fetchRoles,
  updateRole,
  deleteRole,
  fetchSystemPermissions,
  Role,
  SystemPermissionGroup
} from '@/lib/club-api';
import { RoleItem } from './RoleItem';
import { RoleEditorSheet } from './RoleEditorSheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RolesManager({ clubId }: { clubId: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<SystemPermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [rolesData, permsData] = await Promise.all([
          fetchRoles(clubId),
          fetchSystemPermissions()
        ]);

        // Sort roles by hierarchy level descending
        setRoles(rolesData.sort((a, b) => b.hierarchyLevel - a.hierarchyLevel));
        setPermissions(permsData);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load roles',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [clubId, toast]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRoles((items) => {
        const oldIndex = items.findIndex((r) => r._id === active.id);
        const newIndex = items.findIndex((r) => r._id === over.id);

        const newArray = arrayMove(items, oldIndex, newIndex);

        // Immediately trigger API to save new order (hierarchy Level)
        // Hierarchy level is highest at the top (index 0).
        // A simple way is to assign (newArray.length - index) * 10
        const updatedRoles = newArray.map((r, i) => {
          const newLevel = (newArray.length - i) * 10;
          if (r.hierarchyLevel !== newLevel) {
            updateRole(clubId, r._id, { hierarchyLevel: newLevel }).catch(
              () => {
                toast({
                  title: 'Error',
                  description: 'Failed to save hierarchy',
                  variant: 'destructive'
                });
              }
            );
          }
          return { ...r, hierarchyLevel: newLevel };
        });

        return updatedRoles;
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
    try {
      await deleteRole(clubId, role._id);
      setRoles(roles.filter((r) => r._id !== role._id));
      toast({ title: 'Deleted', description: 'Role deleted successfully' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive'
      });
    }
  };

  const handleCreateNew = () => {
    setEditingRole(null);
    setIsEditorOpen(true);
  };

  const onSaveComplete = async () => {
    setIsEditorOpen(false);
    const rolesData = await fetchRoles(clubId);
    setRoles(rolesData.sort((a, b) => b.hierarchyLevel - a.hierarchyLevel));
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={roles.map((r) => r._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {roles.map((role) => (
              <RoleItem
                key={role._id}
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
        allPermissions={permissions}
        onSaveComplete={onSaveComplete}
      />
    </div>
  );
}
