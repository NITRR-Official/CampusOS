/**
 * Check-in Routes
 * Registers check-in endpoints with Express
 */

export function registerCheckInRoutes(app, checkInController, requirePermissions) {
  // List check-ins for event (admin/coordinator only)
  app.get(
    '/api/v1/events/:eventId/checkins',
    requirePermissions('checkin:manage'),
    checkInController.listCheckIns
  );

  // Create check-in record (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/checkins',
    requirePermissions('checkin:manage'),
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
    requirePermissions('checkin:manage'),
    checkInController.getAttendanceStats
  );
}

export default registerCheckInRoutes;
