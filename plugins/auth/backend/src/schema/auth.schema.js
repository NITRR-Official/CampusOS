const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateSignupPayload(payload = {}) {
  const name = normalizeText(payload.name);
  const email = normalizeText(payload.email).toLowerCase();
  const password = typeof payload.password === 'string' ? payload.password : '';
  const errors = [];

  if (name.length < 2 || name.length > 80) {
    errors.push({
      field: 'name',
      message: 'Name must be between 2 and 80 characters'
    });
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({
      field: 'email',
      message: 'Email must be valid'
    });
  }

  if (password.length < 8 || password.length > 128) {
    errors.push({
      field: 'password',
      message: 'Password must be between 8 and 128 characters'
    });
  }

  return {
    errors,
    value: { name, email, password }
  };
}

export function validateLoginPayload(payload = {}) {
  const email = normalizeText(payload.email).toLowerCase();
  const password = typeof payload.password === 'string' ? payload.password : '';
  const errors = [];

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({
      field: 'email',
      message: 'Email must be valid'
    });
  }

  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required'
    });
  }

  return {
    errors,
    value: { email, password }
  };
}
