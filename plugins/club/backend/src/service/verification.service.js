import crypto from 'node:crypto';

export function createVerificationService(verificationRepository, clubService) {
  async function generateTokenForClub(clubId) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Create token expiring in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await verificationRepository.createVerificationToken(
      hashedToken,
      clubId,
      expiresAt
    );

    return rawToken;
  }

  async function verifyEmail(providedToken) {
    const hashedProvidedToken = crypto
      .createHash('sha256')
      .update(providedToken)
      .digest('hex');

    const verificationRecord =
      await verificationRepository.findVerificationToken(hashedProvidedToken);

    if (!verificationRecord) {
      const error = new Error('Invalid or expired verification token');
      error.status = 400; // Bad request
      throw error;
    }

    const club = await clubService.getClub(verificationRecord.clubId);
    if (!club) {
      const error = new Error('Associated club not found');
      error.status = 404;
      throw error;
    }

    if (club.status !== 'pending_verification') {
      const error = new Error('Club is not pending email verification');
      error.status = 400;
      throw error;
    }

    // Update club status to pending (awaiting admin approval)
    const updatedClub = await clubService.updateClubStatus(club.id, 'pending');

    // Clean up the token so it cannot be used again
    await verificationRepository.deleteVerificationToken(
      verificationRecord._id
    );

    return updatedClub;
  }

  return {
    generateTokenForClub,
    verifyEmail
  };
}

export default createVerificationService;
