# API Client & State

When writing frontend components inside `plugins/*/frontend`, you will often need to communicate with the Express routes you wrote in `plugins/*/backend`.

CampusOS uses standard fetch clients or library wrappers (like Axios) configured with interceptors.

## Making API Calls

You can make API requests directly to your backend plugin's Express endpoints. Because everything is hosted under the same domain, relative paths work perfectly.

```typescript
import { useEffect, useState } from 'react';

export function ApplicationList({ clubId }: { clubId: string }) {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    // This hits the Express route you defined in backend/src/index.js
    fetch(`/api/v1/recruitment/clubs/${clubId}/applications`)
      .then(res => res.json())
      .then(data => setApps(data.applications));
  }, [clubId]);

  return (
    <ul>
      {apps.map(app => <li key={app.id}>{app.name}</li>)}
    </ul>
  );
}
```

## Styling

CampusOS uses Tailwind CSS. You can use any standard Tailwind classes inside your components. The Next.js build system will automatically scan your `plugins/*/frontend` folders and compile the required CSS.
