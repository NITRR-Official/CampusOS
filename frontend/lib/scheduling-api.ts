/**
 * Scheduling API Client
 * Frontend API integration for scheduling management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const schedulingAPI = {
  /**
   * Create a new time slot
   */
  async createTimeSlot(eventId: string, slotData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(slotData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create time slot');
    }

    return response.json();
  },

  /**
   * Get event schedule (all time slots)
   */
  async getEventSchedule(eventId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/schedule`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    return response.json();
  },

  /**
   * Get time slot by ID
   */
  async getTimeSlot(slotId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/schedule/${slotId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Time slot not found');
    }

    return response.json();
  },

  /**
   * Update time slot
   */
  async updateTimeSlot(slotId: string, updateData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/schedule/${slotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update time slot');
    }

    return response.json();
  },

  /**
   * Delete time slot
   */
  async deleteTimeSlot(slotId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/schedule/${slotId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete time slot');
    }

    return response.json();
  },

  /**
   * Get all conflicts
   */
  async getAllConflicts(filters: Record<string, unknown> = {}): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters.resolved !== undefined) params.append('resolved', String(filters.resolved));
    if (filters.severity) params.append('severity', String(filters.severity));

    const response = await fetch(`${API_BASE}/api/v1/schedule/conflicts?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conflicts');
    }

    return response.json();
  },

  /**
   * Get conflicts for slot
   */
  async getSlotConflicts(slotId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/schedule/${slotId}/conflicts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch slot conflicts');
    }

    return response.json();
  },

  /**
   * Resolve conflict
   */
  async resolveConflict(conflictId: string, resolution: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/schedule/conflicts/${conflictId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ resolution })
    });

    if (!response.ok) {
      throw new Error('Failed to resolve conflict');
    }

    return response.json();
  },

  /**
   * Check venue availability
   */
  async checkVenueAvailability(venue: string, startTime: string | Date, endTime: string | Date): Promise<unknown> {
    const params = new URLSearchParams({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });

    const response = await fetch(`${API_BASE}/api/v1/schedule/venue/${venue}/available?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check venue availability');
    }

    return response.json();
  },

  /**
   * Get schedule overview
   */
  async getScheduleOverview(eventId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/schedule/overview`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch schedule overview');
    }

    return response.json();
  }
};

export default schedulingAPI;
