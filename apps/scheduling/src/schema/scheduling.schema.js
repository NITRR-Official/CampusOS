/**
 * Scheduling Schema
 * Defines the structure for time slot bookings and scheduling
 */

export const TimeSlotSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier (UUID)'
  },
  eventId: {
    type: 'string',
    required: true,
    description: 'Reference to Event'
  },
  venue: {
    type: 'string',
    required: true,
    description: 'Venue or location name'
  },
  startTime: {
    type: 'date',
    required: true,
    description: 'Slot start time'
  },
  endTime: {
    type: 'date',
    required: true,
    description: 'Slot end time'
  },
  capacity: {
    type: 'number',
    required: true,
    description: 'Venue capacity'
  },
  allocatedResources: {
    type: 'array',
    items: {
      resourceId: 'string',
      quantity: 'number'
    },
    description: 'Resources allocated to this slot'
  },
  status: {
    type: 'string',
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled',
    description: 'Slot status'
  },
  notes: {
    type: 'string',
    nullable: true,
    description: 'Additional scheduling notes'
  },
  createdAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  },
  updatedAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  }
};

export const ScheduleConflictSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier (UUID)'
  },
  slotId1: {
    type: 'string',
    required: true,
    description: 'First conflicting slot ID'
  },
  slotId2: {
    type: 'string',
    required: true,
    description: 'Second conflicting slot ID'
  },
  conflictType: {
    type: 'string',
    enum: ['resource-overlap', 'venue-overlap', 'time-overlap'],
    required: true,
    description: 'Type of conflict'
  },
  severity: {
    type: 'string',
    enum: ['low', 'medium', 'high'],
    required: true,
    description: 'Conflict severity level'
  },
  description: {
    type: 'string',
    required: true,
    description: 'Detailed conflict description'
  },
  resolved: {
    type: 'boolean',
    default: false,
    description: 'Whether conflict has been resolved'
  },
  resolution: {
    type: 'string',
    nullable: true,
    description: 'How conflict was resolved'
  },
  createdAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  },
  updatedAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  }
};
