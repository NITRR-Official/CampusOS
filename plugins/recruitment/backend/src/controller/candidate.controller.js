import { AppError } from '@campus-os/shared/errors';
import {
  updateCandidateStatusSchema,
  updateCandidateNotesSchema
} from '../schema/recruitment.schema.js';
import mongoose from 'mongoose';

export function createCandidateController({
  candidateService,
  registry,
  campaignService
}) {
  // Helper for dynamic RBAC
  const assertManagePermission = async (entityType, entityId, user) => {
    const policy = registry.getService(`${entityType}RbacPolicy`);
    if (policy) {
      const context = await policy.getContext(entityId, user);
      policy.assertPermissions(['recruitment:manage'], context);
    }
  };

  const checkCandidateAccess = async (candidateId, user) => {
    const candidate = await candidateService.getCandidateById(candidateId);
    const campaign = await campaignService.getCampaignById(
      candidate.campaignId
    );
    await assertManagePermission(campaign.entityType, campaign.entityId, user);
  };

  return {
    async getCandidates(req, res, next) {
      try {
        const candidates = await candidateService.getCandidatesByCampaign(
          req.params.campaignId
        );

        // Fetch user names
        const User = mongoose.model('User');
        const userIds = candidates
          .map((c) => c.userId)
          .filter((id) => mongoose.Types.ObjectId.isValid(id));
        const users = await User.find({ _id: { $in: userIds } }).select(
          'name email'
        );
        const userMap = users.reduce((acc, user) => {
          acc[user._id.toString()] = user;
          return acc;
        }, {});

        const enrichedCandidates = candidates.map((c) => {
          const user = userMap[c.userId];
          return {
            ...(c.toObject ? c.toObject() : c),
            name: user ? user.name : undefined,
            email: user ? user.email : undefined
          };
        });

        res.status(200).json({
          success: true,
          count: enrichedCandidates.length,
          data: enrichedCandidates
        });
      } catch (error) {
        next(error);
      }
    },

    async getCandidate(req, res, next) {
      try {
        const candidate = await candidateService.getCandidateById(
          req.params.candidateId
        );
        // Security check: Make sure candidate belongs to the campaign
        if (candidate.campaignId.toString() !== req.params.campaignId) {
          throw new AppError('Candidate does not belong to this campaign', 400);
        }
        res.status(200).json({ success: true, data: candidate });
      } catch (error) {
        next(error);
      }
    },

    async updateStatus(req, res, next) {
      try {
        const validatedData = updateCandidateStatusSchema.parse(req.body);
        await checkCandidateAccess(req.params.candidateId, req.user);

        const candidate = await candidateService.updateCandidateStatus(
          req.params.candidateId,
          validatedData.status
        );
        res.status(200).json({ success: true, data: candidate });
      } catch (error) {
        if (error.name === 'ZodError') {
          return next(new AppError('Validation failed', 400, error.errors));
        }
        next(error);
      }
    },

    async updateNotes(req, res, next) {
      try {
        const validatedData = updateCandidateNotesSchema.parse(req.body);
        await checkCandidateAccess(req.params.candidateId, req.user);

        const candidate = await candidateService.updateCandidateNotes(
          req.params.candidateId,
          validatedData.notes
        );
        res.status(200).json({ success: true, data: candidate });
      } catch (error) {
        if (error.name === 'ZodError') {
          return next(new AppError('Validation failed', 400, error.errors));
        }
        next(error);
      }
    }
  };
}
