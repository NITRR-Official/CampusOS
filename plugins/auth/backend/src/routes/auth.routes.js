export function registerAuthRoutes(app, authController) {
  app.post('/api/v1/auth/signup', authController.signup);
  app.post('/api/v1/auth/login', authController.login);

  app.get('/api/v1/auth/me', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  });
}

export default registerAuthRoutes;
