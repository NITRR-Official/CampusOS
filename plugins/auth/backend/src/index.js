import { createAuthController } from './controller/auth.controller.js';
import { registerAuthRoutes } from './routes/auth.routes.js';
import { initAuthService } from './service/auth.service.js';

export async function init(app, registry, eventBus) {
  initAuthService(registry);
  const authController = createAuthController({ registry });
  registerAuthRoutes(app, authController);

  registry.registerModule('auth', {
    routes: ['/api/v1/auth/signup', '/api/v1/auth/login', '/api/v1/auth/me']
  });
}

export default init;
