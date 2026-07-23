import { authLimiter } from '../middleware/rate-limiter.js';

export function registerAuthRoutes(app, authController, requireSuperAdmin) {
  app.post('/api/v1/auth/signup', authLimiter, authController.signup);
  app.post('/api/v1/auth/login', authLimiter, authController.login);

  app.get('/api/v1/auth/me', authController.getMe);

  if (typeof requireSuperAdmin === 'function') {
    app.get('/api/v1/users', requireSuperAdmin, authController.listUsers);
  }
}

export default registerAuthRoutes;
