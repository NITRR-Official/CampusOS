import { createInstituteController } from './controller/institute.controller.js';
import { registerInstituteRoutes } from './routes/institute.routes.js';

export async function init(app, registry, eventBus) {
  const instituteController = createInstituteController();
  registerInstituteRoutes(app, instituteController);

  registry.registerModule('institute', {
    routes: ['/api/v1/institutes']
  });
}

export default init;
