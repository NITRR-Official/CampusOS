import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Role } from '@plugins/club/frontend/api';
import { GripVertical, Edit2, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RoleItemProps {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoleItem({ role, onEdit, onDelete }: RoleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: (role.id || role._id) as string });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border bg-card shadow-sm transition-colors ${
        isDragging
          ? 'border-primary opacity-80 scale-[1.02]'
          : 'border-border hover:border-primary/30'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-secondary p-1.5 rounded-lg active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="size-4" />
      </div>

      <div className="flex-1 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {role.color && (
            <div
              className="size-3 rounded-full shadow-sm"
              style={{ backgroundColor: role.color }}
            />
          )}
          <span className="font-semibold text-foreground">{role.name}</span>
          {role.isTemplate && (
            <Badge
              variant="secondary"
              className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0"
            >
              Template
            </Badge>
          )}
        </div>

        <div className="hidden md:flex gap-1">
          {role.permissions.slice(0, 3).map((p) => (
            <Badge
              key={p}
              variant="outline"
              className="text-xs bg-background/50"
            >
              {p.split(':')[1] || p}
            </Badge>
          ))}
          {role.permissions.length > 3 && (
            <Badge variant="outline" className="text-xs bg-background/50">
              +{role.permissions.length - 3} more
            </Badge>
          )}
          {role.permissions.length === 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="size-3" /> No permissions
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
          <Edit2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:bg-destructive/10"
          disabled={role.isTemplate}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
