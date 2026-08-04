# Forms Plugin

The Forms plugin provides dynamic, schema-driven form building capabilities. It is used by other plugins (like Event for registrations and Recruitment for applications) to generate custom questionnaires, capture user submissions, and perform complex validation.

## Architecture Layer

**2. Event Layer**

## Collections

- `Form`: Stores form definitions (fields, types, required flags, validation rules).
- `FormSubmission`: Stores the responses submitted by users.

## Events

- **Emits**: `form:submitted`, `form:updated`.
- **Listens for**: `event:deleted`, `recruitment:campaign_deleted` (to cascade delete related forms).

## Permissions

- `forms:view`: Review the data submitted by users.
- `forms:manage`: Create and edit dynamic forms.
- `forms:submit`: Allows users to submit responses to dynamic forms.
