import { z } from 'zod';
import { FormField } from '../types/form';

export function createDynamicSchema(fields: FormField[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Invalid email address');
        if (field.required)
          fieldSchema = (fieldSchema as z.ZodString).min(
            1,
            'This field is required'
          );
        else fieldSchema = fieldSchema.optional().or(z.literal(''));
        break;
      case 'number':
        fieldSchema = z.number({ invalid_type_error: 'Must be a number' });
        if (!field.required) fieldSchema = fieldSchema.optional();
        break;
      case 'checkbox':
        if (field.options && field.options.length > 0) {
          fieldSchema = z.array(z.string());
          if (field.required) {
            fieldSchema = (fieldSchema as z.ZodArray<any>).min(
              1,
              'Please select at least one option'
            );
          } else {
            fieldSchema = fieldSchema.optional();
          }
        } else {
          fieldSchema = z.boolean();
          if (field.required) {
            fieldSchema = (fieldSchema as z.ZodBoolean).refine(
              (val) => val === true,
              {
                message: 'This field is required'
              }
            );
          }
        }
        break;
      case 'select':
      case 'radio':
      case 'text':
      case 'textarea':
      default:
        fieldSchema = z.string();
        if (field.required)
          fieldSchema = (fieldSchema as z.ZodString).min(
            1,
            'This field is required'
          );
        else fieldSchema = fieldSchema.optional().or(z.literal(''));
        break;
    }

    schemaShape[field.id] = fieldSchema;
  });

  return z.object(schemaShape);
}
