/**
 * Vendor API Client
 * Frontend API integration for vendor management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const vendorAPI = {
  /**
   * Create a new vendor
   */
  async createVendor(vendorData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(vendorData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create vendor');
    }

    return response.json();
  },

  /**
   * Get all vendors with optional filters
   */
  async getAllVendors(filters: Record<string, unknown> = {}): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', String(filters.category));
    if (filters.status) params.append('status', String(filters.status));

    const response = await fetch(`${API_BASE}/api/v1/vendors?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }

    return response.json();
  },

  /**
   * Get vendor by ID
   */
  async getVendorById(vendorId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Vendor not found');
    }

    return response.json();
  },

  /**
   * Update vendor
   */
  async updateVendor(vendorId: string, updateData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update vendor');
    }

    return response.json();
  },

  /**
   * Delete vendor
   */
  async deleteVendor(vendorId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete vendor');
    }

    return response.json();
  },

  /**
   * Assign vendor to event
   */
  async assignVendorToEvent(eventId: string, vendorId: string, assignmentData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/vendors/${vendorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(assignmentData)
    });

    if (!response.ok) {
      throw new Error('Failed to assign vendor to event');
    }

    return response.json();
  },

  /**
   * Get vendors for event
   */
  async getEventVendors(eventId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/vendors`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event vendors');
    }

    return response.json();
  },

  /**
   * Get vendor assignments
   */
  async getVendorAssignments(vendorId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}/assignments`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor assignments');
    }

    return response.json();
  },

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(assignmentId: string, status: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/vendors/assignments/${assignmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update assignment status');
    }

    return response.json();
  },

  /**
   * Rate vendor
   */
  async rateVendor(vendorId: string, rating: number): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ rating })
    });

    if (!response.ok) {
      throw new Error('Failed to rate vendor');
    }

    return response.json();
  }
};

export default vendorAPI;
