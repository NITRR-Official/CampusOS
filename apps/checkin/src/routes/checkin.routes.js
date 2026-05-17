/**
 * Check-in Routes
 * Registers check-in endpoints with Express
 */

import checkInController from '../controller/checkin.controller.js';

export function registerCheckInRoutes(app, requireRoles) {
  // List check-ins for event (admin/coordinator only)
  app.get(
    '/api/v1/events/:eventId/checkins',
    requireRoles('admin', 'coordinator'),
    checkInController.listCheckIns
  );

  // Create check-in record (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/checkins',
    requireRoles('admin', 'coordinator'),
    checkInController.createCheckIn
  );

  // Get check-in status for user (self/admin/coordinator)
  app.get(
    '/api/v1/events/:eventId/checkins/status/:userId',
    checkInController.getCheckInStatus
  );

  // Scan QR code to check in (public/self)
  app.post('/api/v1/checkins/scan', checkInController.scanQRCode);

  // Get attendance stats (admin/coordinator only)
  app.get(
    '/api/v1/events/:eventId/attendance-stats',
    requireRoles('admin', 'coordinator'),
    checkInController.getAttendanceStats
  );
}

export default registerCheckInRoutes;
