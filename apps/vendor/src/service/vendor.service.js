import crypto from 'crypto';
import { Vendor } from '../../../../backend/src/database/schemas/vendor.schema.js';

/**
 * Vendor Service
 * Manages vendor and supplier information, assignments, and tracking
 */

function normalizeAssignment(assignment, vendorId) {
  if (!assignment) {
    return null;
  }

  const assignmentId =
    assignment.assignmentId || assignment.id || assignment._id;
  const assignedAt =
    assignment.assignedAt ||
    assignment.assignedDate ||
    assignment.createdAt ||
    null;

  return {
    id: assignmentId,
    eventId: assignment.eventId,
    vendorId,
    amount: assignment.amount ?? null,
    status: assignment.status,
    notes: assignment.notes ?? null,
    assignedAt,
    createdAt: assignment.createdAt || assignedAt || null,
    updatedAt: assignment.updatedAt || assignedAt || null
  };
}

function normalizeVendor(vendorDoc) {
  if (!vendorDoc) {
    return null;
  }

  const vendor = vendorDoc.toObject ? vendorDoc.toObject() : { ...vendorDoc };
  const vendorId = vendor.id || vendor._id;

  vendor.id = vendorId;
  delete vendor._id;
  delete vendor.nameLower;

  if (Array.isArray(vendor.assignments)) {
    vendor.assignments = vendor.assignments
      .map((assignment) => normalizeAssignment(assignment, vendorId))
      .filter(Boolean);
  }

  return vendor;
}

export class VendorService {
  /**
   * Create a new vendor
   * @param {object} vendorData - Vendor information
   * @returns {object} Created vendor record
   */
  async createVendor(vendorData) {
    const {
      name,
      category,
      contactPerson,
      email,
      phone,
      address,
      bankDetails
    } = vendorData;

    if (!name || !category || !contactPerson || !email || !phone) {
      return {
        success: false,
        error:
          'Missing required fields: name, category, contactPerson, email, phone'
      };
    }

    try {
      const vendor = await Vendor.create({
        name,
        nameLower: name.toLowerCase(),
        category,
        contactPerson,
        email,
        phone,
        address: address || null,
        bankDetails: bankDetails || null,
        status: 'active',
        rating: 0,
        totalEvents: 0
      });

      return { success: true, vendor: normalizeVendor(vendor) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get vendor by ID
   * @param {string} vendorId - Vendor ID
   * @returns {object|null} Vendor record
   */
  async getVendorById(vendorId) {
    try {
      const vendor = await Vendor.findById(vendorId).lean();
      return normalizeVendor(vendor);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      return null;
    }
  }

  /**
   * Get vendor by name
   * @param {string} name - Vendor name
   * @returns {object|null} Vendor record
   */
  async getVendorByName(name) {
    try {
      const vendor = await Vendor.findOne({
        nameLower: name.toLowerCase()
      }).lean();
      return normalizeVendor(vendor);
    } catch (error) {
      console.error('Error fetching vendor by name:', error);
      return null;
    }
  }

  /**
   * Get all vendors
   * @param {object} filters - Filter options (category, status)
   * @returns {array} List of vendors
   */
  async getAllVendors(filters = {}) {
    try {
      const query = {};

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      const vendors = await Vendor.find(query).lean();
      return vendors.map((vendor) => normalizeVendor(vendor));
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }

  /**
   * Update vendor information
   * @param {string} vendorId - Vendor ID
   * @param {object} updateData - Data to update
   * @returns {object} Updated vendor record
   */
  async updateVendor(vendorId, updateData) {
    try {
      const updates = { ...updateData, updatedAt: new Date() };
      if (updateData?.name) {
        updates.nameLower = updateData.name.toLowerCase();
      }

      const vendor = await Vendor.findByIdAndUpdate(vendorId, updates, {
        new: true,
        runValidators: true
      });

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      return { success: true, vendor: normalizeVendor(vendor) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete vendor
   * @param {string} vendorId - Vendor ID
   * @returns {object} Deletion result
   */
  async deleteVendor(vendorId) {
    try {
      const vendor = await Vendor.findByIdAndDelete(vendorId);

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      return { success: true, message: 'Vendor deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign vendor to event
   * @param {string} eventId - Event ID
   * @param {string} vendorId - Vendor ID
   * @param {object} assignmentData - Assignment details (amount, notes)
   * @returns {object} Created assignment
   */
  async assignVendorToEvent(eventId, vendorId, assignmentData = {}) {
    if (!eventId || !vendorId) {
      return { success: false, error: 'eventId and vendorId are required' };
    }

    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      const now = new Date();
      const assignment = {
        assignmentId: crypto.randomUUID(),
        eventId,
        amount: assignmentData.amount || null,
        status: 'assigned',
        notes: assignmentData.notes || null,
        assignedAt: now,
        createdAt: now,
        updatedAt: now
      };

      vendor.assignments.push(assignment);
      await vendor.save();

      return {
        success: true,
        assignment: normalizeAssignment(assignment, vendorId)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get vendor assignments for event
   * @param {string} eventId - Event ID
   * @returns {array} List of vendor assignments
   */
  async getEventVendors(eventId) {
    try {
      const vendors = await Vendor.find({
        'assignments.eventId': eventId
      }).lean();

      return vendors.flatMap((vendor) =>
        (vendor.assignments || [])
          .filter((assignment) => assignment.eventId === eventId)
          .map((assignment) => ({
            ...normalizeAssignment(assignment, vendor._id),
            vendorDetails: {
              id: vendor._id,
              name: vendor.name,
              category: vendor.category,
              email: vendor.email,
              phone: vendor.phone
            }
          }))
      );
    } catch (error) {
      console.error('Error fetching event vendors:', error);
      return [];
    }
  }

  /**
   * Get assignments for vendor
   * @param {string} vendorId - Vendor ID
   * @returns {array} List of assignments
   */
  async getVendorAssignments(vendorId) {
    try {
      const vendor = await Vendor.findById(vendorId).lean();
      if (!vendor) {
        return [];
      }

      return (vendor.assignments || [])
        .map((assignment) => normalizeAssignment(assignment, vendorId))
        .filter(Boolean);
    } catch (error) {
      console.error('Error fetching vendor assignments:', error);
      return [];
    }
  }

  /**
   * Update assignment status
   * @param {string} assignmentId - Assignment ID
   * @param {string} newStatus - New status (assigned, confirmed, completed, cancelled)
   * @returns {object} Updated assignment
   */
  async updateAssignmentStatus(assignmentId, newStatus) {
    const validStatuses = ['assigned', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      };
    }

    try {
      const vendor = await Vendor.findOne({
        'assignments.assignmentId': assignmentId
      });
      if (!vendor) {
        return { success: false, error: 'Assignment not found' };
      }

      const assignment = vendor.assignments.find(
        (item) => item.assignmentId === assignmentId
      );
      if (!assignment) {
        return { success: false, error: 'Assignment not found' };
      }

      const previousStatus = assignment.status;
      assignment.status = newStatus;
      assignment.updatedAt = new Date();

      if (previousStatus !== 'completed' && newStatus === 'completed') {
        vendor.totalEvents = (vendor.totalEvents || 0) + 1;
      }

      await vendor.save();

      return {
        success: true,
        assignment: normalizeAssignment(assignment, vendor.id || vendor._id)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rate vendor
   * @param {string} vendorId - Vendor ID
   * @param {number} rating - Rating 0-5
   * @returns {object} Updated vendor
   */
  async rateVendor(vendorId, rating) {
    if (rating < 0 || rating > 5) {
      return { success: false, error: 'Rating must be between 0 and 5' };
    }

    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      vendor.ratings.push({ rating, ratedAt: new Date() });
      vendor.totalRatings = vendor.ratings.length;
      vendor.averageRating =
        vendor.totalRatings > 0
          ? vendor.ratings.reduce((sum, entry) => sum + entry.rating, 0) /
            vendor.totalRatings
          : 0;
      vendor.rating = vendor.averageRating;
      vendor.updatedAt = new Date();

      await vendor.save();

      return { success: true, vendor: normalizeVendor(vendor) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default VendorService;
