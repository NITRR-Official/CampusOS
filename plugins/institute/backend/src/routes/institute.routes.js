export function registerInstituteRoutes(app, instituteController) {
  app.post('/api/v1/institutes', instituteController.create);
  app.get('/api/v1/institutes', instituteController.list);
}

export default registerInstituteRoutes;
