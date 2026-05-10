/**
 * Vendor Schema
 * Defines the structure for vendor and supplier information
 */

export const VendorSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier (UUID)'
  },
  name: {
    type: 'string',
    required: true,
    description: 'Vendor/supplier name'
  },
  category: {
    type: 'string',
    enum: ['catering', 'decoration', 'equipment', 'transportation', 'other'],
    required: true,
    description: 'Type of vendor service'
  },
  contactPerson: {
    type: 'string',
    required: true,
    description: 'Primary contact person name'
  },
  email: {
    type: 'string',
    required: true,
    description: 'Vendor email address'
  },
  phone: {
    type: 'string',
    required: true,
    description: 'Vendor contact number'
  },
  address: {
    type: 'string',
    nullable: true,
    description: 'Vendor business address'
  },
  bankDetails: {
    type: 'object',
    nullable: true,
    properties: {
      accountName: 'string',
      accountNumber: 'string',
      bankName: 'string',
      ifscCode: 'string'
    },
    description: 'Bank account details for payments'
  },
  status: {
    type: 'string',
    enum: ['active', 'inactive', 'blocked'],
    default: 'active',
    description: 'Vendor status'
  },
  rating: {
    type: 'number',
    min: 0,
    max: 5,
    default: 0,
    description: 'Vendor rating based on events'
  },
  totalEvents: {
    type: 'number',
    default: 0,
    description: 'Number of events vendor has participated in'
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

export const VendorAssignmentSchema = {
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
  vendorId: {
    type: 'string',
    required: true,
    description: 'Reference to Vendor'
  },
  assignedAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  },
  amount: {
    type: 'number',
    nullable: true,
    description: 'Payment amount for this assignment'
  },
  status: {
    type: 'string',
    enum: ['assigned', 'confirmed', 'completed', 'cancelled'],
    default: 'assigned',
    description: 'Assignment status'
  },
  notes: {
    type: 'string',
    nullable: true,
    description: 'Additional notes about vendor assignment'
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
