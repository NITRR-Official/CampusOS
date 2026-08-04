import { AppError } from '@campus-os/shared/errors';
import VendorService from '../service/vendor.service.js';
import {
  createVendorSchema,
  updateVendorSchema,
  assignVendorSchema,
  updateVendorAssignmentStatusSchema,
  rateVendorSchema
} from '../schema/vendor.schema.js';

/**
 * Vendor Controller
 * HTTP request handlers for vendor operations
 */

export function createVendorController(vendorService) {
  const service = vendorService || new VendorService();

  return {
    setEventBus(eventBus) {
      service.setEventBus(eventBus);
    },

    /**
     * POST /api/v1/vendors
     * Create a new vendor (admin/coordinator only)
     */
    async createVendor(req, res, next) {
      try {
        const value = createVendorSchema.parse(req.body);

        const vendor = await service.createVendor(value);
        return res.status(201).json(vendor);
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
        const { category, status, clubId } = req.query;
        const filters = {};

        if (!clubId) {
          return next(
            new AppError(
              'clubId is required to list vendors',
              400,
              'VALIDATION_ERROR'
            )
          );
        }
        filters.clubId = clubId;

        if (category) filters.category = category;
        if (status) filters.status = status;

        const vendors = await service.getAllVendors(filters);

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

        const vendor = await service.getVendorById(vendorId);

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
        const updateData = updateVendorSchema.parse(req.body);

        if (!vendorId) {
          return res.status(400).json({ error: 'vendorId is required' });
        }

        const vendor = await service.updateVendor(vendorId, updateData);
        return res.status(200).json(vendor);
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

        const result = await service.deleteVendor(vendorId);
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
        const value = assignVendorSchema.parse(req.body);

        if (!eventId || !vendorId) {
          return res
            .status(400)
            .json({ error: 'eventId and vendorId are required' });
        }

        const assignment = await service.assignVendorToEvent(
          eventId,
          vendorId,
          value
        );
        return res.status(201).json(assignment);
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

        const vendors = await service.getEventVendors(eventId);

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

        const assignments = await service.getVendorAssignments(vendorId);

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
        const { status } = updateVendorAssignmentStatusSchema.parse(req.body);

        if (!assignmentId) {
          return res.status(400).json({ error: 'assignmentId is required' });
        }

        const assignment = await service.updateAssignmentStatus(
          assignmentId,
          status
        );
        return res.status(200).json(assignment);
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
        const { rating } = rateVendorSchema.parse(req.body);

        if (!vendorId) {
          return res.status(400).json({ error: 'vendorId is required' });
        }

        const vendor = await service.rateVendor(vendorId, rating);
        return res.status(200).json(vendor);
      } catch (error) {
        return next(error);
      }
    }
  };
}

export default createVendorController;
