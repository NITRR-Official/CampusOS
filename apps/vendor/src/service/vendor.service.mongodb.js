/**
 * Vendor Service (MongoDB)
 * Manages vendor and supplier information, assignments, and tracking
 */

import { Vendor } from '../../../backend/src/database/schemas/vendor.schema.js';

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
      const vendor = new Vendor({
        name,
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

      await vendor.save();
      return { success: true, vendor: vendor.toObject() };
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
      return vendor || null;
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
      const vendor = await Vendor.findOne({ name }).lean();
      return vendor || null;
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
      let query = Vendor.find();

      if (filters.category) {
        query = query.where('category').equals(filters.category);
      }

      if (filters.status) {
        query = query.where('status').equals(filters.status);
      }

      const vendors = await query.lean();
      return vendors || [];
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
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      return { success: true, vendor: vendor.toObject() };
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

      const assignment = {
        eventId,
        amount: assignmentData.amount || null,
        status: 'assigned',
        notes: assignmentData.notes || null,
        assignedAt: new Date()
      };

      // Add to assignments array
      vendor.assignments.push(assignment);
      await vendor.save();

      return {
        success: true,
        assignment: {
          id: assignment._id || vendor._id,
          ...assignment
        }
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
        vendor.assignments
          .filter((a) => a.eventId === eventId)
          .map((assignment) => ({
            ...assignment,
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
      return vendor?.assignments || [];
    } catch (error) {
      console.error('Error fetching vendor assignments:', error);
      return [];
    }
  }

  /**
   * Update assignment status
   * @param {string} vendorId - Vendor ID
   * @param {string} eventId - Event ID
   * @param {string} newStatus - New status
   * @returns {object} Updated assignment
   */
  async updateAssignmentStatus(vendorId, eventId, newStatus) {
    const validStatuses = ['assigned', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      };
    }

    try {
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          $set: {
            'assignments.$[elem].status': newStatus,
            'assignments.$[elem].updatedAt': new Date()
          }
        },
        {
          new: true,
          arrayFilters: [{ 'elem.eventId': eventId }]
        }
      );

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      return { success: true, assignment: vendor.toObject() };
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
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          $set: { rating, updatedAt: new Date() },
          $push: {
            ratings: {
              rating,
              ratedAt: new Date()
            }
          }
        },
        { new: true, runValidators: true }
      );

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      // Recalculate average rating
      const avgRating =
        vendor.ratings.length > 0
          ? (
              vendor.ratings.reduce((sum, r) => sum + r.rating, 0) /
              vendor.ratings.length
            ).toFixed(2)
          : 0;

      vendor.averageRating = parseFloat(avgRating);
      vendor.totalRatings = vendor.ratings.length;
      await vendor.save();

      return { success: true, vendor: vendor.toObject() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default VendorService;
