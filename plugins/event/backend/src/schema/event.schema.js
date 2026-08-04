import { z } from 'zod';

export const createEventSchemaBase = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be between 3 and 140 characters')
      .max(140, 'Title must be between 3 and 140 characters'),
    description: z
      .string()
      .trim()
      .max(1000, 'Description must be 1000 characters or fewer')
      .optional()
      .default(''),
    instituteId: z
      .string()
      .trim()
      .min(1, 'Institute ID is required')
      .max(50, 'Institute ID must be 50 characters or fewer'),
    clubId: z
      .string()
      .trim()
      .min(1, 'clubId is required')
      .max(50, 'Club ID must be 50 characters or fewer'),
    venue: z
      .string()
      .trim()
      .max(140, 'Venue must be 140 characters or fewer')
      .optional()
      .nullable(),
    capacity: z
      .number()
      .int()
      .positive('Capacity must be a positive integer when provided')
      .optional()
      .nullable(),
    startsAt: z
      .string()
      .datetime('startsAt must be a valid ISO date-time string'),
    endsAt: z
      .string()
      .datetime('endsAt must be a valid ISO date-time string')
      .optional()
      .nullable()
  })
  .strict();

export const createEventSchema = createEventSchemaBase.refine(
  (data) => {
    if (data.startsAt && data.endsAt) {
      return new Date(data.endsAt) >= new Date(data.startsAt);
    }
    return true;
  },
  {
    message: 'endsAt cannot be before startsAt',
    path: ['endsAt']
  }
);

export const updateEventSchema = createEventSchemaBase
  .partial()
  .strict()
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'endsAt cannot be before startsAt',
      path: ['endsAt']
    }
  )
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one updatable field is required',
    path: ['payload']
  });

export const registrationSchema = z
  .object({
    attendeeName: z
      .string()
      .trim()
      .min(2, 'Attendee name must be between 2 and 80 characters')
      .max(80, 'Attendee name must be between 2 and 80 characters'),
    attendeeEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email('Attendee email must be valid')
  })
  .strict();
