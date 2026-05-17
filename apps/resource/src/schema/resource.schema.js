/**
 * Resource Schema
 * Defines the structure for equipment and resource information
 */

export const ResourceSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier (UUID)'
  },
  name: {
    type: 'string',
    required: true,
    description: 'Resource/equipment name'
  },
  type: {
    type: 'string',
    enum: [
      'audio',
      'visual',
      'lighting',
      'seating',
      'stage',
      'decoration',
      'other'
    ],
    required: true,
    description: 'Type of resource'
  },
  quantity: {
    type: 'number',
    required: true,
    default: 1,
    description: 'Total quantity available'
  },
  availableQuantity: {
    type: 'number',
    required: true,
    default: 1,
    description: 'Currently available quantity'
  },
  description: {
    type: 'string',
    nullable: true,
    description: 'Detailed description of resource'
  },
  location: {
    type: 'string',
    nullable: true,
    description: 'Storage location or building'
  },
  condition: {
    type: 'string',
    enum: ['excellent', 'good', 'fair', 'needs-repair'],
    default: 'good',
    description: 'Current condition status'
  },
  maintenanceDate: {
    type: 'date',
    nullable: true,
    description: 'Last maintenance/service date'
  },
  owner: {
    type: 'string',
    nullable: true,
    description: 'Owner or department name'
  },
  cost: {
    type: 'number',
    nullable: true,
    description: 'Purchase/replacement cost'
  },
  status: {
    type: 'string',
    enum: ['available', 'in-use', 'maintenance', 'retired'],
    default: 'available',
    description: 'Resource status'
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

export const ResourceAllocationSchema = {
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
  resourceId: {
    type: 'string',
    required: true,
    description: 'Reference to Resource'
  },
  allocatedQuantity: {
    type: 'number',
    required: true,
    description: 'Quantity allocated for this event'
  },
  startDate: {
    type: 'date',
    required: true,
    description: 'Start date of allocation'
  },
  endDate: {
    type: 'date',
    required: true,
    description: 'End date of allocation'
  },
  notes: {
    type: 'string',
    nullable: true,
    description: 'Additional notes about allocation'
  },
  status: {
    type: 'string',
    enum: ['allocated', 'in-use', 'returned', 'damaged'],
    default: 'allocated',
    description: 'Allocation status'
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
