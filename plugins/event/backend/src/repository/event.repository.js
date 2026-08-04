import mongoose from 'mongoose';
import { Event } from '../schema/event.model.js';
import { EventRegistration } from '../schema/event-registration.model.js';

export function createEventRepository() {
  async function saveEvent(eventData) {
    const eventId = eventData.id || eventData._id;
    if (eventId) {
      // Update existing
      const { id, _id, ...updateData } = eventData;
      return Event.findByIdAndUpdate(eventId, updateData, {
        returnDocument: 'after',
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

  async function listEvents(clubId, options = {}) {
    const limit = parseInt(options.limit, 10) || 50;
    const page = parseInt(options.page, 10) || 1;
    const skip = (page - 1) * limit;

    const query = {};
    if (clubId) {
      query.clubId = clubId;
    }

    if (options.participantEmail) {
      const regs = await EventRegistration.find({
        attendeeEmail: options.participantEmail.toLowerCase()
      })
        .select('eventId')
        .lean()
        .exec();
      const eventIds = regs.map((r) => r.eventId);
      query._id = { $in: eventIds };
    }

    return Event.find(query)
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async function listPublicEvents(clubId) {
    const pipeline = [{ $match: { status: 'published' } }];

    if (clubId) {
      pipeline.push({ $match: { clubId } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'clubs',
          localField: 'clubId',
          foreignField: '_id',
          as: 'club'
        }
      },
      {
        $unwind: { path: '$club', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          id: '$_id',
          title: 1,
          description: 1,
          venue: 1,
          capacity: 1,
          startsAt: 1,
          endsAt: 1,
          status: 1,
          clubId: 1,
          'club.name': 1,
          'club.slug': 1,
          registrationsCount: 1
        }
      }
    );

    return Event.aggregate(pipeline).exec();
  }

  async function getPublicEventById(eventId) {
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(eventId);
    } catch (e) {
      return null;
    }

    const pipeline = [
      { $match: { _id: objectId, status: 'published' } },
      {
        $lookup: {
          from: 'clubs',
          localField: 'clubId',
          foreignField: '_id',
          as: 'club'
        }
      },
      {
        $unwind: { path: '$club', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          id: '$_id',
          title: 1,
          description: 1,
          venue: 1,
          capacity: 1,
          startsAt: 1,
          endsAt: 1,
          status: 1,
          clubId: 1,
          'club.name': 1,
          'club.slug': 1,
          registrationsCount: 1
        }
      }
    ];

    const results = await Event.aggregate(pipeline).exec();
    return results.length > 0 ? results[0] : null;
  }

  async function createRegistration(registrationData) {
    const reg = new EventRegistration(registrationData);
    await reg.save();
    return reg.toObject();
  }

  async function incrementRegistrationCount(
    eventId,
    incrementBy = 1,
    capacityLimit = null
  ) {
    const filter = { _id: eventId };

    // If a capacity limit exists, enforce it atomically
    if (capacityLimit !== null && capacityLimit > 0 && incrementBy > 0) {
      // Must have enough capacity left
      filter.registrationsCount = { $lte: capacityLimit - incrementBy };
    }

    const updated = await Event.findOneAndUpdate(
      filter,
      { $inc: { registrationsCount: incrementBy } },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();

    return updated;
  }

  async function findRegistrationByEmail(eventId, email) {
    return EventRegistration.findOne({
      eventId,
      attendeeEmail: email.toLowerCase()
    })
      .lean()
      .exec();
  }

  async function findRegistrationsByEvent(eventId) {
    return EventRegistration.find({ eventId }).lean().exec();
  }

  return {
    saveEvent,
    getEventById,
    getEventsByClub,
    listEvents,
    deleteEvent,
    listPublicEvents,
    getPublicEventById,
    createRegistration,
    incrementRegistrationCount,
    findRegistrationByEmail,
    findRegistrationsByEvent
  };
}
