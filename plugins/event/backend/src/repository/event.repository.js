import { Event } from '../schema/event.model.js';

export function createEventRepository() {
  async function saveEvent(eventData) {
    if (eventData.id) {
      // Update existing
      const { id, ...updateData } = eventData;
      return Event.findByIdAndUpdate(id, updateData, { new: true })
        .lean()
        .exec();
    }
    // Create new
    const event = new Event(eventData);
    await event.save();
    return event.toObject();
  }

  async function getEventById(eventId) {
    return Event.findById(eventId).lean().exec();
  }

  async function deleteEvent(eventId) {
    const result = await Event.deleteOne({ _id: eventId });
    return result.deletedCount > 0;
  }

  async function getEventsByClub(clubId) {
    return Event.find({ clubId }).lean().exec();
  }

  async function listEvents() {
    return Event.find().lean().exec();
  }

  return {
    saveEvent,
    getEventById,
    getEventsByClub,
    listEvents,
    deleteEvent
  };
}
