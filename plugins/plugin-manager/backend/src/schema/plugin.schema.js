import { z } from 'zod';

export const togglePluginSchema = z
  .object({
    enabled: z.boolean({
      required_error: 'enabled is required',
      invalid_type_error: 'enabled must be a boolean'
    })
  })
  .strict();
