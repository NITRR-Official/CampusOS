/**
 * Resource API Client
 * Frontend API integration for resource management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const resourceAPI = {
  /**
   * Create a new resource
   */
  async createResource(resourceData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(resourceData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create resource');
    }

    return response.json();
  },

  /**
   * Get all resources with optional filters
   */
  async getAllResources(filters: Record<string, unknown> = {}): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition) params.append('condition', String(filters.condition));

    const response = await fetch(`${API_BASE}/api/v1/resources?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    return response.json();
  },

  /**
   * Get available resources
   */
  async getAvailableResources(filters: Record<string, unknown> = {}): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition) params.append('condition', String(filters.condition));

    const response = await fetch(`${API_BASE}/api/v1/resources/available?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available resources');
    }

    return response.json();
  },

  /**
   * Get resource by ID
   */
  async getResourceById(resourceId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/resources/${resourceId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Resource not found');
    }

    return response.json();
  },

  /**
   * Update resource
   */
  async updateResource(resourceId: string, updateData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/resources/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update resource');
    }

    return response.json();
  },

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/resources/${resourceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete resource');
    }

    return response.json();
  },

  /**
   * Allocate resource to event
   */
  async allocateResourceToEvent(eventId: string, resourceId: string, allocationData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/resources/${resourceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(allocationData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to allocate resource');
    }

    return response.json();
  },

  /**
   * Get resources for event
   */
  async getEventResources(eventId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/resources`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event resources');
    }

    return response.json();
  },

  /**
   * Get resource allocations
   */
  async getResourceAllocations(resourceId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/resources/${resourceId}/allocations`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resource allocations');
    }

    return response.json();
  },

  /**
   * Update allocation status
   */
  async updateAllocationStatus(allocationId: string, status: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/resources/allocations/${allocationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update allocation status');
    }

    return response.json();
  },

  /**
   * Update resource maintenance
   */
  async updateMaintenance(resourceId: string, maintenanceDate: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/resources/${resourceId}/maintenance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ maintenanceDate })
    });

    if (!response.ok) {
      throw new Error('Failed to update maintenance date');
    }

    return response.json();
  }
};

export default resourceAPI;
