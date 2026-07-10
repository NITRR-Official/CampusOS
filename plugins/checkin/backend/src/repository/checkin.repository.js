import { CheckIn } from '../schema/checkin.model.js';

export function createCheckInRepository() {
  async function saveCheckIn(checkInData) {
    if (checkInData.id) {
      // Update existing
      const { id, ...updateData } = checkInData;
      return CheckIn.findByIdAndUpdate(id, updateData, { new: true }).lean().exec();
    }
    // Create new
    const checkIn = new CheckIn(checkInData);
    await checkIn.save();
    return checkIn.toObject();
  }

  async function getCheckInById(checkInId) {
    return CheckIn.findById(checkInId).lean().exec();
  }

  async function getCheckInByQRCode(qrCode) {
    return CheckIn.findOne({ qrCode }).lean().exec();
  }

  async function getCheckInsByEventId(eventId) {
    return CheckIn.find({ eventId }).lean().exec();
  }

  async function getUserCheckInStatus(eventId, userId) {
    return CheckIn.findOne({ eventId, userId }).lean().exec();
  }

  async function listAllCheckIns() {
    return CheckIn.find().lean().exec();
  }

  async function deleteEventCheckIns(eventId) {
    const result = await CheckIn.deleteMany({ eventId });
    return result.deletedCount;
  }

  return {
    saveCheckIn,
    getCheckInById,
    getCheckInByQRCode,
    getCheckInsByEventId,
    getUserCheckInStatus,
    listAllCheckIns,
    deleteEventCheckIns
  };
}
