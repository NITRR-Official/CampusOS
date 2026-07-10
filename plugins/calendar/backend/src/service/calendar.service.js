import { CalendarEvent } from '../schema/calendar.model.js';

class CalendarService {
  async createEvent(payload) {
    const event = new CalendarEvent({
      title: payload.title,
      eventType: payload.eventType,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt || null,
      description: payload.description || null,
      linkedTaskId: payload.linkedTaskId || null,
      linkedEventId: payload.linkedEventId || null,
      createdBy: payload.createdBy
    });

    await event.save();
    return event.toObject();
  }

  async listEvents() {
    return CalendarEvent.find().sort({ startsAt: 1 }).lean().exec();
  }

  async getEventsBetween(startDate, endDate) {
    return CalendarEvent.find({
      startsAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .sort({ startsAt: 1 })
      .lean()
      .exec();
  }

  async getEvent(eventId) {
    return CalendarEvent.findById(eventId).lean().exec();
  }

  async deleteEvent(eventId) {
    const result = await CalendarEvent.findByIdAndDelete(eventId).exec();
    return !!result;
  }
}

const calendarService = new CalendarService();

export function getCalendarService() {
  return calendarService;
}

export default getCalendarService;
