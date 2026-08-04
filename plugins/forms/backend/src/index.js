import { createFormService } from './service/form.service.js';
import { createFormResponseService } from './service/form-response.service.js';
import { createFormRepository } from './repository/form.repository.js';
import { createFormResponseRepository } from './repository/form-response.repository.js';
import { FormModel } from './schema/form.model.js';
import { FormResponseModel } from './schema/form-response.model.js';
import { createFormController } from './controller/form.controller.js';
import { registerFormRoutes } from './routes/form.routes.js';

export async function init(app, registry, eventBus) {
  // 1. Get Shared Services
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error(
      'Permission middleware service (requirePermissions) is not configured'
    );
  }

  // Register Permissions
  if (registry.permissions) {
    registry.permissions.register({
      id: 'forms:manage',
      name: 'Manage Forms',
      description: 'Create and edit forms, and view responses.',
      module: 'forms'
    });
    registry.permissions.register({
      id: 'forms:view',
      name: 'View Forms',
      description: 'View forms available to the club.',
      module: 'forms'
    });
    registry.permissions.register({
      id: 'forms:submit',
      name: 'Submit Forms',
      description: 'Submit responses to forms.',
      module: 'forms'
    });
  }

  // 2. Instantiate Repositories
  const formRepository = createFormRepository(FormModel);
  const formResponseRepository =
    createFormResponseRepository(FormResponseModel);

  // 3. Instantiate Services
  const formService = createFormService(formRepository, eventBus);
  const formResponseService = createFormResponseService(
    formResponseRepository,
    formRepository,
    eventBus
  );

  // 4. Instantiate Controller
  const formController = createFormController({
    formService,
    formResponseService,
    registry
  });

  // 4. Register Routes
  registerFormRoutes(app, formController, requirePermissions);

  // 5. Register Service for programmatic access by other plugins
  registry.registerService('forms:service', formService);
  registry.registerService('forms:response-service', formResponseService);

  // 6. Register Module
  registry.registerModule('forms', {
    routes: [
      'GET /api/v1/forms',
      'POST /api/v1/forms',
      'GET /api/v1/forms/:formId',
      'GET /api/v1/forms/:formId/responses',
      'POST /api/v1/forms/:formId/responses'
    ]
  });

  console.log('✓ Loaded plugin: forms');
}
