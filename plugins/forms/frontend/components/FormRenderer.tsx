'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSchema, FormField } from '../types/form';
import { createDynamicSchema } from '../utils/dynamic-zod';
import {
  Form,
  FormControl,
  FormField as HookFormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Textarea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@campusos/design-system';

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
  initialData?: Record<string, any>;
}

export function FormRenderer({
  schema,
  onSubmit,
  isSubmitting = false,
  initialData
}: FormRendererProps) {
  const zodSchema = useMemo(
    () => createDynamicSchema(schema.fields),
    [schema.fields]
  );

  const resetValues = useMemo(() => {
    return schema.fields.reduce(
      (acc, field) => {
        if (initialData && initialData[field.id] !== undefined) {
          acc[field.id] = initialData[field.id];
        } else {
          if (field.type === 'checkbox') {
            acc[field.id] =
              field.options && field.options.length > 0 ? [] : false;
          } else {
            acc[field.id] = '';
          }
        }
        return acc;
      },
      {} as Record<string, any>
    );
  }, [initialData, schema.fields]);

  const form = useForm({
    resolver: zodResolver(zodSchema),
    values: resetValues
  });

  const renderField = (field: FormField, hookField: any) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || ''}
            {...hookField}
            className="resize-y"
          />
        );
      case 'select':
      case 'radio': // For now, we'll map radio to select for consistency, or we could use a radio group
        return (
          <HookFormField
            control={form.control}
            name={field.id}
            render={({ field: hookField }: { field: any }) => (
              <Select
                onValueChange={hookField.onChange}
                defaultValue={hookField.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={field.placeholder || 'Select an option'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {field.options?.map((opt, i) => (
                    <SelectItem key={i} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );
      case 'checkbox':
        if (!field.options || field.options.length === 0) {
          return (
            <HookFormField
              control={form.control}
              name={field.id}
              render={({ field: hookField }: { field: any }) => (
                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/10">
                  <FormControl>
                    <Checkbox
                      checked={hookField.value}
                      onCheckedChange={hookField.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{field.label}</FormLabel>
                  </div>
                </div>
              )}
            />
          );
        }

        return (
          <div className="space-y-3">
            {field.options.map((opt) => (
              <HookFormField
                key={opt}
                control={form.control}
                name={field.id}
                render={({ field: hookField }: { field: any }) => {
                  return (
                    <FormItem
                      key={opt}
                      className="flex flex-row items-center space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={hookField.value?.includes(opt)}
                          onCheckedChange={(checked: boolean) => {
                            const current = hookField.value || [];
                            const updated = checked
                              ? [...current, opt]
                              : current.filter((val: string) => val !== opt);
                            hookField.onChange(updated);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer m-0">
                        {opt}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || ''}
            {...hookField}
            onChange={(e) =>
              hookField.onChange(e.target.valueAsNumber || e.target.value)
            }
          />
        );
      case 'email':
      case 'text':
      default:
        return (
          <Input
            type={field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder || ''}
            {...hookField}
          />
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-primary/10">
      <CardHeader className="bg-muted/30 border-b pb-6">
        <CardTitle className="text-2xl font-bold">{schema.title}</CardTitle>
        {schema.description && (
          <CardDescription className="text-base mt-2">
            {schema.description}
          </CardDescription>
        )}
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            {schema.fields.map((field) => (
              <HookFormField
                key={field.id}
                control={form.control}
                name={field.id}
                render={({ field: hookField }: { field: any }) => (
                  <FormItem className="space-y-3">
                    {field.type !== 'checkbox' ||
                    (field.type === 'checkbox' &&
                      field.options &&
                      field.options.length > 0) ? (
                      <FormLabel className="text-base font-semibold">
                        {field.label}{' '}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </FormLabel>
                    ) : null}
                    <FormControl>{renderField(field, hookField)}</FormControl>
                    <FormMessage className="text-sm opacity-90" />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter className="border-t bg-muted/10 pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
