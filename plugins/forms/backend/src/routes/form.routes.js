import { Router } from 'express';

export function registerFormRoutes(app, controller, requirePermissions) {
  const router = Router();

  // Define routes
  // Forms
  router.get('/', requirePermissions('forms:view'), controller.getForms);
  router.post('/', requirePermissions('forms:manage'), controller.createForm);
  router.get('/:formId', requirePermissions('forms:view'), controller.getForm);
  router.put(
    '/:formId',
    requirePermissions('forms:manage'),
    controller.updateForm
  );

  // Responses
  router.get(
    '/:formId/responses',
    requirePermissions('forms:manage'),
    controller.getResponses
  );
  router.get(
    '/:formId/responses/:responseId',
    requirePermissions('forms:manage'),
    controller.getResponse
  );
  router.post(
    '/:formId/responses',
    requirePermissions('forms:submit'),
    controller.submitResponse
  );

  // Mount router
  app.use('/api/v1/forms', router);
}
