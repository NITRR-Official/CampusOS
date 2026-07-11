import { z } from 'zod';

export const createCalendarEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be between 3 and 140 characters')
      .max(140, 'Title must be between 3 and 140 characters'),
    eventType: z.enum(['task-deadline', 'event', 'milestone'], {
      errorMap: () => ({
        message: 'Event type must be task-deadline, event, or milestone'
      })
    }),
    startsAt: z
      .string()
      .datetime('startsAt must be a valid ISO date-time string'),
    endsAt: z
      .string()
      .datetime('endsAt must be a valid ISO date-time string')
      .optional()
      .nullable(),
    description: z
      .string()
      .trim()
      .max(1000, 'Description must be 1000 characters or fewer')
      .optional()
      .nullable(),
    linkedTaskId: z
      .string()
      .trim()
      .max(50, 'Linked Task ID must be 50 characters or fewer')
      .optional()
      .nullable(),
    linkedEventId: z
      .string()
      .trim()
      .max(50, 'Linked Event ID must be 50 characters or fewer')
      .optional()
      .nullable()
  })
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
  );

export const queryCalendarEventsSchema = z
  .object({
    startDate: z
      .string()
      .datetime('startDate must be a valid ISO date-time string'),
    endDate: z.string().datetime('endDate must be a valid ISO date-time string')
  })
  .strict()
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'endDate cannot be before startDate',
      path: ['endDate']
    }
  );
