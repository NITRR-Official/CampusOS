import crypto from 'crypto';
import { VerificationToken } from '../schema/verification-token.model.js';
import { Club } from '../schema/club.model.js';

/**
 * Handles the generation and validation of verification tokens.
 */
class VerificationService {
  /**
   * Generates a new secure token for a club.
   * @param {string} clubId 
   * @returns {Promise<string>} The raw token string
   */
  async generateTokenForClub(clubId) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Create token expiring in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await VerificationToken.create({
      token: rawToken,
      clubId,
      expiresAt
    });

    return rawToken;
  }

  /**
   * Validates a token and approves the email verification.
   * @param {string} token 
   * @returns {Promise<Object>} The updated club document
   * @throws {Error} If token is invalid or expired
   */
  async verifyEmail(token) {
    const verificationRecord = await VerificationToken.findOne({ token }).populate('clubId');
    
    if (!verificationRecord) {
      const error = new Error('Invalid or expired verification token');
      error.status = 400; // Bad request
      throw error;
    }

    const club = verificationRecord.clubId;
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
    club.status = 'pending';
    await club.save();

    // Clean up the token so it cannot be used again
    await VerificationToken.deleteOne({ _id: verificationRecord._id });

    return club;
  }
}

export const verificationService = new VerificationService();
