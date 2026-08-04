import { Router } from 'express';

export function registerFormRoutes(app, controller, requirePermissions) {
  const router = Router();

  const viewForms = requirePermissions('form:view');
  const manageForms = requirePermissions('form:manage');

  // Define routes
  // Forms
  router.get('/', viewForms, controller.getForms);
  router.post('/', manageForms, controller.createForm);
  router.get('/:formId', viewForms, controller.getForm);
  router.put('/:formId', manageForms, controller.updateForm);

  // Responses
  router.get('/:formId/responses', manageForms, controller.getResponses);
  router.get(
    '/:formId/responses/:responseId',
    manageForms,
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
