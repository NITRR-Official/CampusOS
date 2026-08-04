/**
 * Vendor Plugin
 * Handles vendor and supplier management for events
 */

import { registerVendorRoutes } from './routes/vendor.routes.js';
import { createVendorService } from './service/vendor.service.js';
import { VendorRepository } from './repository/vendor.repository.js';
import { registerVendorHandlers } from './listeners/index.js';
import { createVendorController } from './controller/vendor.controller.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const vendorRepository = new VendorRepository();
  const vendorService = createVendorService(vendorRepository);
  if (eventBus) {
    vendorService.setEventBus(eventBus);
  }
  const vendorController = createVendorController(vendorService);

  if (eventBus) {
    vendorController.setEventBus(eventBus);
  }

  registerVendorRoutes(app, vendorController, requirePermissions);

  registry.registerModule('vendor', {
    routes: [
      'POST /api/v1/vendors',
      'GET /api/v1/vendors',
      'GET /api/v1/vendors/:vendorId',
      'PUT /api/v1/vendors/:vendorId',
      'DELETE /api/v1/vendors/:vendorId',
      'POST /api/v1/events/:eventId/vendors/:vendorId',
      'GET /api/v1/events/:eventId/vendors',
      'GET /api/v1/vendors/:vendorId/assignments',
      'PUT /api/v1/vendors/assignments/:assignmentId/status',
      'POST /api/v1/vendors/:vendorId/rate'
    ]
  });

  if (registry.permissions) {
    registry.permissions.register({
      id: 'vendor:view',
      module: 'vendor',
      label: 'View Vendors',
      description: 'Allows viewing vendors'
    });
    registry.permissions.register({
      id: 'vendor:manage',
      module: 'vendor',
      label: 'Manage Vendors',
      description: 'Allows adding vendors, managing quotes, and invoices'
    });
  }

  registry.registerContextResolver('/api/v1/vendors', async (req) => {
    const vendorId = req.params?.vendorId || req.url.split('/')[4];
    if (!vendorId || vendorId === 'assignments') return null;
    try {
      const VendorModel = (await import('./schema/vendor.model.js')).Vendor;
      const vendorDoc = await VendorModel.findById(vendorId)
        .select('clubId')
        .lean();
      return vendorDoc?.clubId
        ? { type: 'club:member_service', id: vendorDoc.clubId.toString() }
        : null;
    } catch {
      return null;
    }
  });

  if (eventBus) {
    registerVendorHandlers(eventBus, registry, vendorService);
  }
}

export default init;
