'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, FieldType } from '../types/form';
import {
  Plus,
  Trash2,
  GripVertical,
  Settings2,
  ArrowUp,
  ArrowDown,
  Type,
  AlignLeft,
  Hash,
  Mail,
  List,
  CheckSquare,
  CircleDot
} from 'lucide-react';
import { Button, Input, Card, Checkbox, Label } from '@campusos/design-system';
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
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormBuilderProps {
  initialFields?: FormField[];
  onChange?: (fields: FormField[]) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] =
  [
    { type: 'text', label: 'Short Text', icon: <Type className="w-4 h-4" /> },
    {
      type: 'textarea',
      label: 'Long Text',
      icon: <AlignLeft className="w-4 h-4" />
    },
    { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { type: 'select', label: 'Dropdown', icon: <List className="w-4 h-4" /> },
    {
      type: 'checkbox',
      label: 'Checkbox',
      icon: <CheckSquare className="w-4 h-4" />
    },
    {
      type: 'radio',
      label: 'Multiple Choice',
      icon: <CircleDot className="w-4 h-4" />
    }
  ];

function SortableFieldItem({
  field,
  index,
  totalFields,
  moveField,
  removeField,
  updateField
}: {
  field: FormField;
  index: number;
  totalFields: number;
  moveField: (index: number, direction: 'up' | 'down') => void;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
    isDragging
  } = useSortable({
    id: field.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: isDragging ? ('relative' as const) : undefined
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`relative p-5 border-l-4 border-l-primary group hover:shadow-md transition-shadow bg-card ${isDragging ? 'opacity-80 shadow-2xl scale-[1.02]' : ''}`}
      >
        {/* Drag Handle (Left Edge) */}
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Controls (Top Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md border shadow-sm p-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => moveField(index, 'up')}
            disabled={index === 0}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => moveField(index, 'down')}
            disabled={index === totalFields - 1}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeField(field.id)}
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4 pl-4 pr-4 md:pr-16">
          <div className="flex flex-col space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5 font-semibold">
              {FIELD_TYPES.find((t) => t.type === field.type)?.icon}
              {FIELD_TYPES.find((t) => t.type === field.type)?.label}
            </Label>
            <Input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              className="font-medium text-lg border-transparent hover:border-input focus:border-input transition-colors h-auto py-1 px-2 -ml-2"
              placeholder="Question Title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
            {field.type !== 'checkbox' &&
              field.type !== 'radio' &&
              field.type !== 'select' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Placeholder Text
                  </Label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) =>
                      updateField(field.id, { placeholder: e.target.value })
                    }
                    placeholder="e.g. Enter your answer..."
                    className="h-8 text-sm bg-background"
                  />
                </div>
              )}

            <div className="flex items-center space-x-2 pt-2 md:pt-6">
              <Checkbox
                id={`required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked: boolean) =>
                  updateField(field.id, { required: !!checked })
                }
              />
              <Label
                htmlFor={`required-${field.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                Required Field
              </Label>
            </div>
          </div>

          {/* Options editor for Select/Radio/Checkbox */}
          {(field.type === 'select' ||
            field.type === 'radio' ||
            field.type === 'checkbox') && (
            <div className="space-y-2 mt-4 pl-2 border-l-2 border-primary/20">
              <Label className="text-xs text-muted-foreground uppercase font-semibold">
                Options
              </Label>
              <div className="space-y-2">
                <AnimatePresence>
                  {field.options?.map((opt, optIndex) => (
                    <motion.div
                      key={`${field.id}-opt-${optIndex}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(field.options || [])];
                          newOpts[optIndex] = e.target.value;
                          updateField(field.id, { options: newOpts });
                        }}
                        className="h-8 text-sm"
                        placeholder={`Option ${optIndex + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const newOpts = field.options?.filter(
                            (_, i) => i !== optIndex
                          );
                          updateField(field.id, { options: newOpts });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 mt-1 border-dashed"
                  onClick={() => {
                    const newOpts = [
                      ...(field.options || []),
                      `Option ${(field.options?.length || 0) + 1}`
                    ];
                    updateField(field.id, { options: newOpts });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function FormBuilder({
  initialFields = [],
  onChange
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);

  const notifyChange = (newFields: FormField[]) => {
    setFields(newFields);
    if (onChange) onChange(newFields);
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `New ${type} field`,
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type)
        ? ['Option 1', 'Option 2']
        : []
    };
    notifyChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    const newFields = fields.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    notifyChange(newFields);
  };

  const removeField = (id: string) => {
    notifyChange(fields.filter((f) => f.id !== id));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [
      newFields[swapIndex],
      newFields[index]
    ];

    notifyChange(newFields);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      notifyChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* List of Fields */}
      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field, index) => (
              <SortableFieldItem
                key={field.id}
                field={field}
                index={index}
                totalFields={fields.length}
                moveField={moveField}
                removeField={removeField}
                updateField={updateField}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {fields.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
          <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No fields yet
          </h3>
          <p className="text-sm">Add fields below to build your form schema.</p>
        </div>
      )}

      {/* Toolbox */}
      <Card className="p-4 bg-muted/50 border-dashed">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Add Field:
          </span>
          <div className="flex flex-wrap gap-2">
            {FIELD_TYPES.map(({ type, label, icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                onClick={() => addField(type)}
              >
                {icon}
                <span className="ml-1.5">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
