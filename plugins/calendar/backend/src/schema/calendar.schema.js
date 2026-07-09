function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDate(value) {
  const text = normalizeText(value);
  return text || null;
}

const VALID_EVENT_TYPES = new Set(['task-deadline', 'event', 'milestone']);

export function validateCreateCalendarEventPayload(payload = {}) {
  const title = normalizeText(payload.title);
  const eventType = normalizeText(payload.eventType).toLowerCase();
  const startsAt = normalizeDate(payload.startsAt);
  const endsAt = normalizeDate(payload.endsAt);
  const description = normalizeText(payload.description);
  const linkedTaskId = normalizeText(payload.linkedTaskId);
  const linkedEventId = normalizeText(payload.linkedEventId);
  const errors = [];

  if (title.length < 3 || title.length > 140) {
    errors.push({
      field: 'title',
      message: 'Title must be between 3 and 140 characters'
    });
  }

  if (!VALID_EVENT_TYPES.has(eventType)) {
    errors.push({
      field: 'eventType',
      message: 'Event type must be task-deadline, event, or milestone'
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

  if (description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Description must be 1000 characters or fewer'
    });
  }

  return {
    errors,
    value: {
      title,
      eventType,
      startsAt,
      endsAt: endsAt || null,
      description: description || null,
      linkedTaskId: linkedTaskId || null,
      linkedEventId: linkedEventId || null
    }
  };
}

export function validateQueryCalendarEventsPayload(payload = {}) {
  const startDate = normalizeDate(payload.startDate);
  const endDate = normalizeDate(payload.endDate);
  const errors = [];

  if (!startDate) {
    errors.push({
      field: 'startDate',
      message: 'Start date is required'
    });
  }

  if (startDate && Number.isNaN(Date.parse(startDate))) {
    errors.push({
      field: 'startDate',
      message: 'startDate must be a valid ISO date-time string'
    });
  }

  if (!endDate) {
    errors.push({
      field: 'endDate',
      message: 'End date is required'
    });
  }

  if (endDate && Number.isNaN(Date.parse(endDate))) {
    errors.push({
      field: 'endDate',
      message: 'endDate must be a valid ISO date-time string'
    });
  }

  if (
    startDate &&
    endDate &&
    !Number.isNaN(Date.parse(startDate)) &&
    !Number.isNaN(Date.parse(endDate)) &&
    Date.parse(endDate) < Date.parse(startDate)
  ) {
    errors.push({
      field: 'endDate',
      message: 'endDate cannot be before startDate'
    });
  }

  return {
    errors,
    value: {
      startDate,
      endDate
    }
  };
}
