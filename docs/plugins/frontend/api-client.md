# API Client & State

CampusOS utilizes a strictly typed, schema-validated fetching pattern for the frontend.

## The Global API Client

Do **not** use raw `fetch()` or `axios`. CampusOS provides a unified wrapper around native `fetch` located at `frontend/lib/api/client.ts`. This client handles:

- Base URL resolution
- Authentication token injection (Bearer headers)
- Standardized error handling and throwing
- **Zod Schema Validation** (Type-safe responses)

### Zod Validation

Whenever you fetch data, you must provide a Zod schema to validate the response payload. This ensures that the frontend fails safely if the backend contract changes unexpectedly.

```typescript
import { z } from 'zod';
import { apiClient } from '@campus-os/shared/api-client';

const UserSchema = z.object({
  id: z.string(),
  name: z.string()
});

// apiClient.get will parse the response against UserSchema
export const fetchUsers = () =>
  apiClient.get('/api/v1/users', { schema: z.array(UserSchema) });
```

## React Query & Hooks

Frontend components should never manually manage loading states or `useEffect` for fetching. We use **React Query**.

Every plugin exports its custom hooks from `plugins/<module>/frontend/hooks.ts`:

```typescript
// plugins/auth/frontend/hooks.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchUsers, loginUser } from './api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: loginUser
  });
}
```

Components simply consume these hooks:

```tsx
import { useUsers } from '../hooks';

export function UserList() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Styling & Transpilation

CampusOS uses Tailwind CSS. Because plugins live outside the `frontend/` Next.js root, they must be explicitly transpiled.

The `frontend/next.config.ts` dynamically scans the `plugins/` directory and injects every plugin into the `transpilePackages` array automatically. All you have to do is build your component and it will just work!
