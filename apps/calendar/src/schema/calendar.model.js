/**
 * Calendar Event Model
 * Mongoose model for calendar event persistence.
 *
 * Note: the conventional `calendar.schema.js` name is already used by the
 * request-validation module, so the Mongoose model lives in `calendar.model.js`
 * to keep validation and persistence concerns in clearly separated files.
 *
 * Schema field groups (data relationships, GitHub issue #41):
 *
 *  - CORE: title, eventType, startsAt, endsAt, description — the user-facing
 *    descriptive properties of an event. These are exposed by the current HTTP
 *    API and are unchanged from the original schema.
 *  - LINKAGE: linkedTaskId, linkedEventId (singular, current API) and
 *    linkedTaskIds (forward-looking, multi-link). Linkage fields associate an
 *    event with tasks/other events in the wider workflow graph. The singular
 *    `linkedTaskId` is retained for API compatibility; `linkedTaskIds` is a
 *    foundational multi-link field for future many-to-many relationships and is
 *    NOT yet exposed by the current API.
 *  - LIFECYCLE: status — tracks an event's workflow state over time. Defaults to
 *    'scheduled' so existing create calls and the current API response are
 *    unaffected. Foundational for future workflow features; not yet exposed by
 *    the current API.
 *  - WORKFLOW OWNERSHIP: assignedTeams, assignees, coordinators — capture who is
 *    responsible for / participating in an event. All default to empty arrays.
 *    Foundational for future workflow features; not yet exposed by the current API.
 *  - RECURRENCE: recurrence, category — placeholders for future recurring-event
 *    scheduling (RRULE-style) and categorization. Default to null. Foundational;
 *    not yet exposed by the current API.
 *
 * IMPORTANT: All workflow-extensibility fields (status, recurrence, category,
 * assignedTeams, assignees, coordinators, linkedTaskIds) are OPTIONAL and
 * sensibly defaulted so existing create calls keep working. They are persisted
 * but intentionally NOT included in the current API response serializer, which
 * preserves its exact 11-field shape.
 */

import mongoose from 'mongoose';

const EVENT_TYPES = ['task-deadline', 'event', 'milestone'];
const STATUS_VALUES = ['scheduled', 'in-progress', 'completed', 'cancelled'];

const calendarEventSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },

    // --- CORE (exposed by current API) ---
    title: {
      type: String,
      required: true,
      trim: true
    },
    eventType: {
      type: String,
      required: true,
      enum: EVENT_TYPES
    },
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      default: null
    },
    description: {
      type: String,
      default: null
    },

    // --- LINKAGE ---
    // Singular link fields are exposed by the current API (compatibility).
    linkedTaskId: {
      type: String,
      default: null
    },
    linkedEventId: {
      type: String,
      default: null
    },
    // Forward-looking multi-link field; foundational, not yet exposed by the API.
    linkedTaskIds: {
      type: [String],
      default: []
    },

    // --- CORE (exposed by current API) ---
    createdBy: {
      type: String,
      required: true
    },

    // --- LIFECYCLE (foundational, not yet exposed by the API) ---
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'scheduled'
    },

    // --- WORKFLOW OWNERSHIP (foundational, not yet exposed by the API) ---
    assignedTeams: {
      type: [String],
      default: []
    },
    assignees: {
      type: [String],
      default: []
    },
    coordinators: {
      type: [String],
      default: []
    },

    // --- RECURRENCE / CATEGORIZATION (foundational, not yet exposed by the API) ---
    // Placeholder for future RRULE-style recurring scheduling.
    recurrence: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    category: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'calendarevents'
  }
);

// Ascending index supports ascending-ordered listing and date-range queries.
calendarEventSchema.index({ startsAt: 1 });
// Lifecycle index supports filtering/aggregating events by workflow status.
calendarEventSchema.index({ status: 1 });

export const CalendarEvent = mongoose.model(
  'CalendarEvent',
  calendarEventSchema
);

export default CalendarEvent;
