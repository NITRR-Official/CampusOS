function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDate(value) {
  const text = normalizeText(value);
  return text || null;
}

function normalizeCapacity(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

const VALID_STATUS = new Set(['draft', 'published']);

export function validateCreateEventPayload(payload = {}) {
  const title = normalizeText(payload.title);
  const description = normalizeText(payload.description);
  const instituteId = normalizeText(payload.instituteId);
  const clubId = normalizeText(payload.clubId);
  const venue = normalizeText(payload.venue);
  const capacity = normalizeCapacity(payload.capacity);
  const startsAt = normalizeDate(payload.startsAt);
  const endsAt = normalizeDate(payload.endsAt);
  const errors = [];

  if (title.length < 3 || title.length > 140) {
    errors.push({
      field: 'title',
      message: 'Title must be between 3 and 140 characters'
    });
  }

  if (!instituteId) {
    errors.push({
      field: 'instituteId',
      message: 'Institute ID is required'
    });
  }

  if (description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Description must be 1000 characters or fewer'
    });
  }

  if (venue.length > 140) {
    errors.push({
      field: 'venue',
      message: 'Venue must be 140 characters or fewer'
    });
  }

  if (Number.isNaN(capacity) || (capacity !== null && capacity < 1)) {
    errors.push({
      field: 'capacity',
      message: 'Capacity must be a positive integer when provided'
    });
  }

  if (!startsAt) {
    errors.push({
      field: 'startsAt',
      message: 'Start date-time is required'
    });
  }

  if (startsAt && Number.isNaN(Date.parse(startsAt))) {
    errors.push({
      field: 'startsAt',
      message: 'startsAt must be a valid ISO date-time string'
    });
  }

  if (endsAt && Number.isNaN(Date.parse(endsAt))) {
    errors.push({
      field: 'endsAt',
      message: 'endsAt must be a valid ISO date-time string'
    });
  }

  if (
    startsAt &&
    endsAt &&
    !Number.isNaN(Date.parse(startsAt)) &&
    !Number.isNaN(Date.parse(endsAt)) &&
    Date.parse(endsAt) < Date.parse(startsAt)
  ) {
    errors.push({
      field: 'endsAt',
      message: 'endsAt cannot be before startsAt'
    });
  }

  return {
    errors,
    value: {
      title,
      description,
      instituteId,
      clubId: clubId || null,
      venue: venue || null,
      capacity,
      startsAt,
      endsAt
    }
  };
}

export function validateUpdateEventPayload(payload = {}) {
  const updates = {};
  const errors = [];

  if (payload.title !== undefined) {
    updates.title = normalizeText(payload.title);

    if (updates.title.length < 3 || updates.title.length > 140) {
      errors.push({
        field: 'title',
        message: 'Title must be between 3 and 140 characters'
      });
    }
  }

  if (payload.description !== undefined) {
    updates.description = normalizeText(payload.description);

    if (updates.description.length > 1000) {
      errors.push({
        field: 'description',
        message: 'Description must be 1000 characters or fewer'
      });
    }
  }

  if (payload.venue !== undefined) {
    updates.venue = normalizeText(payload.venue);

    if (updates.venue.length > 140) {
      errors.push({
        field: 'venue',
        message: 'Venue must be 140 characters or fewer'
      });
    }
  }

  if (payload.capacity !== undefined) {
    updates.capacity = normalizeCapacity(payload.capacity);

    if (
      Number.isNaN(updates.capacity) ||
      (updates.capacity !== null && updates.capacity < 1)
    ) {
      errors.push({
        field: 'capacity',
        message: 'Capacity must be a positive integer when provided'
      });
    }
  }

  if (payload.startsAt !== undefined) {
    updates.startsAt = normalizeDate(payload.startsAt);

    if (!updates.startsAt || Number.isNaN(Date.parse(updates.startsAt))) {
      errors.push({
        field: 'startsAt',
        message: 'startsAt must be a valid ISO date-time string'
      });
    }
  }

  if (payload.endsAt !== undefined) {
    updates.endsAt = normalizeDate(payload.endsAt);

    if (updates.endsAt && Number.isNaN(Date.parse(updates.endsAt))) {
      errors.push({
        field: 'endsAt',
        message: 'endsAt must be a valid ISO date-time string'
      });
    }
  }

  if (Object.keys(updates).length === 0) {
    errors.push({
      field: 'payload',
      message: 'At least one updatable field is required'
    });
  }

  if (
    updates.startsAt &&
    updates.endsAt &&
    !Number.isNaN(Date.parse(updates.startsAt)) &&
    !Number.isNaN(Date.parse(updates.endsAt)) &&
    Date.parse(updates.endsAt) < Date.parse(updates.startsAt)
  ) {
    errors.push({
      field: 'endsAt',
      message: 'endsAt cannot be before startsAt'
    });
  }

  return {
    errors,
    value: updates
  };
}

export function validateRegistrationPayload(payload = {}) {
  const attendeeName = normalizeText(payload.attendeeName);
  const attendeeEmail = normalizeText(payload.attendeeEmail).toLowerCase();
  const errors = [];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (attendeeName.length < 2 || attendeeName.length > 80) {
    errors.push({
      field: 'attendeeName',
      message: 'Attendee name must be between 2 and 80 characters'
    });
  }

  if (!emailPattern.test(attendeeEmail)) {
    errors.push({
      field: 'attendeeEmail',
      message: 'Attendee email must be valid'
    });
  }

  return {
    errors,
    value: {
      attendeeName,
      attendeeEmail
    }
  };
}

export function validateStatus(status) {
  return VALID_STATUS.has(status);
}
