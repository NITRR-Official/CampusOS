import { createAuthController } from './controller/auth.controller.js';
import { registerAuthRoutes } from './routes/auth.routes.js';
import { createAuthService } from './service/auth.service.js';
import { createAuthRepository } from './repository/auth.repository.js';

export async function init(app, registry, eventBus) {
  const models = registry.getService('core:models');
  if (!models || !models.User) {
    throw new Error('core:models service not found in registry');
  }

  const authRepository = createAuthRepository(models.User);
  const authService = createAuthService(authRepository);
  const authController = createAuthController({ registry, authService });
  
  registerAuthRoutes(app, authController);

  registry.registerModule('auth', {
    routes: ['/api/v1/auth/signup', '/api/v1/auth/login', '/api/v1/auth/me']
  });
}

export default init;
