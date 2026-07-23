import { ClubEvents } from '../constants/club.constants.js';
import { mailProvider } from '../service/mail.provider.js';
import { registerRecruitmentListener } from './recruitment.listener.js';

export function registerEventHandlers(eventBus, services) {
  const { memberService, verificationService } = services;

  registerRecruitmentListener(eventBus, services);

  eventBus.on(ClubEvents.PROPOSED, async (payload) => {
    try {
      const club = payload.data;
      if (!club) return;
      const token = await verificationService.generateTokenForClub(
        club.id || club._id
      );
      await mailProvider.sendVerificationEmail(club.email, club.name, token);
    } catch (err) {
      console.error(
        'Failed to send verification email for club proposal:',
        err
      );
    }
  });

  eventBus.on('user:deleted', async (payload) => {
    if (payload && payload.userId) {
      await memberService.removeAllUserMemberships(payload.userId);
    }
  });
}
