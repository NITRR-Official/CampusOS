# Services and Events

CampusOS backend plugins are initialized by exporting an `init` function from `backend/src/index.js`.

```javascript
export async function init(app, registry, eventBus) {
  // Plugin logic here
}
```

The Plugin Loader injects three powerful objects: `app` (Express app), `registry` (Service Registry), and `eventBus` (Pub/Sub system).

## 1. The Express App (`app`)

This is the raw Express application instance. You can mount your routers directly to it.

```javascript
import express from 'express';
import { recruitmentRouter } from './controllers/recruitment';

export async function init(app, registry, eventBus) {
  const router = express.Router();
  router.get('/ping', (req, res) => res.json({ message: 'pong' }));

  app.use('/api/v1/recruitment', router);
}
```

## 2. The Service Registry (`registry`)

The registry is an internal Dependency Injection container. It allows plugins to expose JavaScript functions to other plugins, avoiding direct `import` statements and circular dependency crashes.

### Fetching a Service

If you declared a dependency on `club` in your `plugin.json`, you can safely fetch its exported services:

```javascript
const requirePermissions = registry.getService('requirePermissions');
const clubService = registry.getService('clubService');

const clubs = await clubService.getAllClubs();
```

### Fetching Core Models

If your plugin needs to interact with the system's core models (like `User` or `Plugin`), **never** use relative imports like `../../../../../backend/src/...` to import them directly from the monolith. Doing so creates brittle coupling.

Instead, retrieve them from the `core:models` service provided by the registry during initialization:

```javascript
let User;

export async function init(app, registry, eventBus) {
  const models = registry.getService('core:models');
  if (!models || !models.User) {
    throw new Error('core:models service not found in registry');
  }
  User = models.User;
  // Now you can safely use User in your plugin's controllers or services
}
```

### Exporting a Service

You can expose your own APIs for other plugins to consume:

```javascript
registry.registerService('recruitmentService', {
  getApplicantCount: async (clubId) => {
    return await Applicant.countDocuments({ clubId });
  }
});
```

### Registering your Module

You must register your module's existence so the Frontend UI knows it is active. This populates the `/api/v1/system/modules` endpoint.

```javascript
registry.registerModule('recruitment', {
  routes: [
    'GET /api/v1/recruitment/applications',
    'POST /api/v1/recruitment/apply'
  ]
});
```

## 3. The EventBus (`eventBus`)

The EventBus is a global `EventEmitter` designed to decouple plugins. Instead of hardcoding logic, plugins emit events when something happens, and other plugins can listen.

### Emitting an Event

```javascript
// A student successfully applied to a club
eventBus.emit('recruitment.applied', {
  studentId: '123',
  clubId: '456'
});
```

### Listening to an Event

```javascript
// In another plugin (e.g., the Task or Notification plugin)
eventBus.on('recruitment:applied', async (data) => {
  console.log(`Sending email notification to student ${data.studentId}`);
});
```

### EventBus Best Practices

To ensure the monolithic backend remains fast and stable, you must follow these rules when using the EventBus:

1. **Strict Namespacing:** Always prefix your events with your plugin name and a colon (e.g. `recruitment:applied`, `club:created`). Never emit generic events like `created`.
2. **Emit IDs, Not Objects:** Pass lightweight identifiers (like `userId` or `clubId`) in your payload rather than entire database objects.
3. **Do Not Block the Thread:** The EventBus operates locally in-memory. If your listener performs heavy synchronous work (like a massive `for` loop), it will block the entire Node.js event loop. Always wrap heavy tasks in `async` functions or background workers.
