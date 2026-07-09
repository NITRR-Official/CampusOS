export function createCheckInRepository() {
  const storage = new Map();
  const qrCodeIndex = new Map();

  async function saveCheckIn(checkIn) {
    storage.set(checkIn.id, checkIn);
    qrCodeIndex.set(checkIn.qrCode, checkIn.id);
    return checkIn;
  }

  async function getCheckInById(checkInId) {
    return storage.get(checkInId) || null;
  }

  async function getCheckInByQRCode(qrCode) {
    const checkInId = qrCodeIndex.get(qrCode);
    return checkInId ? storage.get(checkInId) : null;
  }

  async function getCheckInsByEventId(eventId) {
    return Array.from(storage.values()).filter(
      (checkIn) => checkIn.eventId === eventId
    );
  }

  async function getUserCheckInStatus(eventId, userId) {
    return (
      Array.from(storage.values()).find(
        (checkIn) => checkIn.eventId === eventId && checkIn.userId === userId
      ) || null
    );
  }

  async function listAllCheckIns() {
    return Array.from(storage.values());
  }

  return {
    saveCheckIn,
    getCheckInById,
    getCheckInByQRCode,
    getCheckInsByEventId,
    getUserCheckInStatus,
    listAllCheckIns
  };
}
