function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDate(value) {
  const text = normalizeText(value);
  return text || null;
}

const VALID_STATUSES = new Set(['todo', 'in-progress', 'done']);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);

function normalizePriority(value) {
  const priority = normalizeText(value).toLowerCase();
  return priority || 'medium';
}

export function validateCreateTaskPayload(payload = {}) {
  const title = normalizeText(payload.title);
  const description = normalizeText(payload.description);
  const assigneeName = normalizeText(payload.assigneeName);
  const dueDate = normalizeDate(payload.dueDate);
  const priority = normalizePriority(payload.priority);
  const errors = [];

  if (title.length < 3 || title.length > 140) {
    errors.push({
      field: 'title',
      message: 'Title must be between 3 and 140 characters'
    });
  }

  if (description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Description must be 1000 characters or fewer'
    });
  }

  if (assigneeName && (assigneeName.length < 2 || assigneeName.length > 80)) {
    errors.push({
      field: 'assigneeName',
      message: 'Assignee name must be between 2 and 80 characters'
    });
  }

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    errors.push({
      field: 'dueDate',
      message: 'dueDate must be a valid ISO date-time string'
    });
  }

  if (!VALID_PRIORITIES.has(priority)) {
    errors.push({
      field: 'priority',
      message: 'Priority must be low, medium, or high'
    });
  }

  return {
    errors,
    value: {
      title,
      description,
      assigneeName: assigneeName || null,
      dueDate,
      priority
    }
  };
}

export function validateAssignTaskPayload(payload = {}) {
  const assigneeName = normalizeText(payload.assigneeName);
  const errors = [];

  if (assigneeName.length < 2 || assigneeName.length > 80) {
    errors.push({
      field: 'assigneeName',
      message: 'Assignee name must be between 2 and 80 characters'
    });
  }

  return {
    errors,
    value: {
      assigneeName
    }
  };
}

export function validateStatusPayload(payload = {}) {
  const status = normalizeText(payload.status).toLowerCase();
  const errors = [];

  if (!VALID_STATUSES.has(status)) {
    errors.push({
      field: 'status',
      message: 'Status must be todo, in-progress, or done'
    });
  }

  return {
    errors,
    value: {
      status
    }
  };
}

export function validatePriorityPayload(payload = {}) {
  const priority = normalizeText(payload.priority).toLowerCase();
  const errors = [];

  if (!VALID_PRIORITIES.has(priority)) {
    errors.push({
      field: 'priority',
      message: 'Priority must be low, medium, or high'
    });
  }

  return {
    errors,
    value: {
      priority
    }
  };
}
