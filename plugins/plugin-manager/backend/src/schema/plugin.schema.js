import { z } from 'zod';

export const togglePluginSchema = z
  .object({
    enabled: z.boolean({
      required_error: 'enabled is required',
      invalid_type_error: 'enabled must be a boolean'
    })
  })
  .strict();

export const updateSettingsSchema = z
  .object({
    settings: z.record(z.any(), {
      required_error: 'settings object is required'
    })
  })
  .strict();
