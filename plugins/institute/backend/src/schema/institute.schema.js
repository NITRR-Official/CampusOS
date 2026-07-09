function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateCreateInstitutePayload(payload = {}) {
  const name = normalizeText(payload.name);
  const code = normalizeText(payload.code).toUpperCase();
  const description = normalizeText(payload.description);
  const location = normalizeText(payload.location);
  const errors = [];

  if (name.length < 3 || name.length > 120) {
    errors.push({
      field: 'name',
      message: 'Name must be between 3 and 120 characters'
    });
  }

  if (code && (code.length < 2 || code.length > 12)) {
    errors.push({
      field: 'code',
      message: 'Code must be between 2 and 12 characters'
    });
  }

  if (description.length > 500) {
    errors.push({
      field: 'description',
      message: 'Description must be 500 characters or fewer'
    });
  }

  if (location.length > 120) {
    errors.push({
      field: 'location',
      message: 'Location must be 120 characters or fewer'
    });
  }

  return {
    errors,
    value: {
      name,
      code,
      description,
      location
    }
  };
}
