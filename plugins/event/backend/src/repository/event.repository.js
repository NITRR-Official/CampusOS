import { Event } from '../schema/event.model.js';

export function createEventRepository() {
  async function saveEvent(eventData) {
    const eventId = eventData.id || eventData._id;
    if (eventId) {
      // Update existing
      const { id, _id, ...updateData } = eventData;
      return Event.findByIdAndUpdate(eventId, updateData, {
        new: true,
        returnDocument: 'after'
      })
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

  async function listEvents(clubId) {
    if (clubId) {
      return Event.find({ clubId }).lean().exec();
    }
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
