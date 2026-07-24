import { Router } from 'express';

export function registerFormRoutes(app, controller, requirePermissions) {
  const router = Router();

  // Define routes
  // Forms
  router.get('/', requirePermissions(), controller.getForms);
  router.post('/', requirePermissions(), controller.createForm);
  router.get('/:formId', requirePermissions(), controller.getForm);
  router.put('/:formId', requirePermissions(), controller.updateForm);

  // Responses
  router.get(
    '/:formId/responses',
    requirePermissions(),
    controller.getResponses
  );
  router.get(
    '/:formId/responses/:responseId',
    requirePermissions(),
    controller.getResponse
  );
  router.post(
    '/:formId/responses',
    requirePermissions(),
    controller.submitResponse
  );

  // Mount router
  app.use('/api/v1/forms', router);
}
