import VendorService from '../service/vendor.service.js';

const vendorService = new VendorService();

/**
 * Vendor Controller
 * HTTP request handlers for vendor operations
 */

export const vendorController = {
  /**
   * POST /api/v1/vendors
   * Create a new vendor (admin/coordinator only)
   */
  async createVendor(req, res, next) {
    try {
      const { name, category, contactPerson, email, phone, address, bankDetails } = req.body;

      const result = await vendorService.createVendor({
        name,
        category,
        contactPerson,
        email,
        phone,
        address,
        bankDetails
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.vendor);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/vendors
   * List all vendors with optional filters
   */
  async listVendors(req, res, next) {
    try {
      const { category, status } = req.query;
      const filters = {};

      if (category) filters.category = category;
      if (status) filters.status = status;

      const vendors = await vendorService.getAllVendors(filters);

      return res.status(200).json({
        count: vendors.length,
        vendors
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/vendors/:vendorId
   * Get vendor details by ID
   */
  async getVendor(req, res, next) {
    try {
      const { vendorId } = req.params;

      if (!vendorId) {
        return res.status(400).json({ error: 'vendorId is required' });
      }

      const vendor = await vendorService.getVendorById(vendorId);

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      return res.status(200).json(vendor);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * PUT /api/v1/vendors/:vendorId
   * Update vendor information (admin/coordinator only)
   */
  async updateVendor(req, res, next) {
    try {
      const { vendorId } = req.params;
      const updateData = req.body;

      if (!vendorId) {
        return res.status(400).json({ error: 'vendorId is required' });
      }

      const result = await vendorService.updateVendor(vendorId, updateData);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json(result.vendor);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * DELETE /api/v1/vendors/:vendorId
   * Delete a vendor (admin only)
   */
  async deleteVendor(req, res, next) {
    try {
      const { vendorId } = req.params;

      if (!vendorId) {
        return res.status(400).json({ error: 'vendorId is required' });
      }

      const result = await vendorService.deleteVendor(vendorId);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/events/:eventId/vendors/:vendorId
   * Assign vendor to event (admin/coordinator only)
   */
  async assignVendorToEvent(req, res, next) {
    try {
      const { eventId, vendorId } = req.params;
      const { amount, notes } = req.body;

      if (!eventId || !vendorId) {
        return res.status(400).json({ error: 'eventId and vendorId are required' });
      }

      const result = await vendorService.assignVendorToEvent(eventId, vendorId, { amount, notes });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.assignment);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/events/:eventId/vendors
   * Get all vendors assigned to an event
   */
  async getEventVendors(req, res, next) {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      const vendors = await vendorService.getEventVendors(eventId);

      return res.status(200).json({
        eventId,
        count: vendors.length,
        vendors
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/vendors/:vendorId/assignments
   * Get all event assignments for a vendor
   */
  async getVendorAssignments(req, res, next) {
    try {
      const { vendorId } = req.params;

      if (!vendorId) {
        return res.status(400).json({ error: 'vendorId is required' });
      }

      const assignments = await vendorService.getVendorAssignments(vendorId);

      return res.status(200).json({
        vendorId,
        count: assignments.length,
        assignments
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * PUT /api/v1/vendors/assignments/:assignmentId/status
   * Update assignment status (admin/coordinator only)
   */
  async updateAssignmentStatus(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const { status } = req.body;

      if (!assignmentId) {
        return res.status(400).json({ error: 'assignmentId is required' });
      }

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      const result = await vendorService.updateAssignmentStatus(assignmentId, status);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.assignment);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/vendors/:vendorId/rate
   * Rate vendor (admin/coordinator/user only)
   */
  async rateVendor(req, res, next) {
    try {
      const { vendorId } = req.params;
      const { rating } = req.body;

      if (!vendorId) {
        return res.status(400).json({ error: 'vendorId is required' });
      }

      if (rating === undefined || rating === null) {
        return res.status(400).json({ error: 'rating is required' });
      }

      const result = await vendorService.rateVendor(vendorId, rating);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.vendor);
    } catch (error) {
      return next(error);
    }
  }
};

export default vendorController;
