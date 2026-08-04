import { AppError } from '@campus-os/shared/errors';

/**
 * Creates a middleware that automatically resolves a club slug to a MongoDB ObjectId
 * for all incoming requests that specify a clubId.
 *
 * @param {Object} ClubModel - The Mongoose Club model
 * @returns {Function} Express middleware
 */
export function createSlugResolver(ClubModel) {
  return async (req, res, next) => {
    try {
      // Find clubId in query, params, or body
      let clubId = req.query?.clubId || req.params?.clubId || req.body?.clubId;

      // Some routes use /clubs/:clubId directly in the path (which ends up in params)
      // We already checked req.params.clubId above.

      if (!clubId) {
        return next();
      }

      // Check if it's already a 24-character MongoDB ObjectId
      if (typeof clubId === 'string' && /^[0-9a-fA-F]{24}$/.test(clubId)) {
        return next();
      }

      // If it's not an ObjectId, treat it as a slug and look it up
      const club = await ClubModel.findOne({ slug: clubId }).select(
        '_id name slug status'
      );

      if (!club) {
        return next(
          new AppError(`Club with slug '${clubId}' not found`, 404, 'NOT_FOUND')
        );
      }

      const realObjectId = club._id.toString();

      // Replace the slug with the real ObjectId in the request objects
      if (req.query?.clubId) req.query.clubId = realObjectId;
      if (req.params?.clubId) req.params.clubId = realObjectId;
      if (req.body?.clubId) req.body.clubId = realObjectId;

      // Attach the context so downstream middleware (like RBAC) doesn't have to query it again
      req.clubContext = club;
      req.resolvedContext = { type: 'club:member_service', id: realObjectId };

      next();
    } catch (error) {
      next(error);
    }
  };
}
