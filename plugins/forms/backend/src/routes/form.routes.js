import { Router } from 'express';

export function registerFormRoutes(app, controller, requirePermissions) {
  const router = Router();

  const manageForms = requirePermissions('forms:manage');

  // Define routes
  // Forms: fetching forms by entity or by formId is public/attendee accessible
  router.get('/', controller.getForms);
  router.post('/', manageForms, controller.createForm);
  router.get('/:formId', controller.getForm);
  router.put('/:formId', manageForms, controller.updateForm);

  // Responses: restricted to managers with assertManagePermission
  router.get('/:formId/responses', manageForms, controller.getResponses);
  router.get(
    '/:formId/responses/:responseId',
    manageForms,
    controller.getResponse
  );
  router.post('/:formId/responses', controller.submitResponse);

  // Mount router
  app.use('/api/v1/forms', router);
}
