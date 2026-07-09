/**
 * Check-in Schema
 * Tracks event attendance with QR codes
 */

export const CheckInSchema = {
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
  userId: {
    type: 'string',
    required: true,
    description: 'Reference to attendee User'
  },
  qrCode: {
    type: 'string',
    required: true,
    unique: true,
    description: 'Unique QR code identifier'
  },
  status: {
    type: 'string',
    enum: ['pending', 'checked-in'],
    default: 'pending',
    description: 'Attendance status'
  },
  checkedInAt: {
    type: 'date',
    nullable: true,
    description: 'Timestamp when attendee checked in'
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

export default CheckInSchema;
