import { AppError } from '@campus-os/shared/errors';
import mongoose from 'mongoose';

/**
 * Creates an Express param callback for :clubId parameter that resolves
 * slugs to ObjectIds and attaches req.clubContext and req.resolvedContext
 * without mutating req.body or req.query.
 *
 * @param {Object} ClubModel - The Mongoose Club model
 * @returns {Function} Express param callback (req, res, next, clubId)
 */
export function createSlugParamHandler(ClubModel) {
  return async (req, res, next, clubId) => {
    try {
      if (!clubId) {
        return next();
      }

      // Check if it's a valid 24-char ObjectId
      const isObjectId = mongoose.isValidObjectId(clubId);
      const query = isObjectId
        ? { $or: [{ _id: clubId }, { slug: clubId }] }
        : { slug: clubId };

      const club = await ClubModel.findOne(query).select(
        '_id name slug status'
      );

      if (!club) {
        return next(
          new AppError(`Club '${clubId}' not found`, 404, 'NOT_FOUND')
        );
      }

      const realObjectId = club._id.toString();

      // Normalize params.clubId so controllers expecting ObjectId get it
      if (req.params) {
        req.params.clubId = realObjectId;
      }

      // Attach context objects to avoid re-querying in downstream RBAC
      req.clubContext = club;
      req.resolvedContext = { type: 'club:member_service', id: realObjectId };

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Backward-compatible alias for existing imports
export const createSlugResolver = createSlugParamHandler;

export default createSlugParamHandler;
