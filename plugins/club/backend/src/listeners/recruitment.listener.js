export function registerRecruitmentListener(
  eventBus,
  { memberService, authService, roleService }
) {
  eventBus.on('recruitment:candidate_selected', async (payload) => {
    try {
      const { entityType, entityId, userId, onboardRoleName } = payload;

      // We only care if the recruitment was for a club
      if (entityType !== 'club') {
        return;
      }

      // 1. Fetch user to get the email (needed by memberService.addMember)
      const user = await authService.getUserById(userId);
      if (!user) {
        console.error(
          `[Club Listener] User ${userId} not found when onboarding candidate.`
        );
        return;
      }

      // 2. Fetch the target role
      const roleName = onboardRoleName || 'volunteer';
      const role = await roleService.findRoleByName(entityId, roleName);

      if (!role) {
        console.error(
          `[Club Listener] Role '${roleName}' not found in club ${entityId}. Cannot auto-onboard user.`
        );
        return;
      }

      // 3. Add the member
      await memberService.addMember(entityId, { email: user.email }, role);
      console.log(
        `[Club Listener] Successfully auto-onboarded user ${userId} to club ${entityId} as '${roleName}'`
      );
    } catch (err) {
      if (err.code === 'MEMBER_EXISTS') {
        console.log(
          `[Club Listener] User ${payload.userId} is already a member of club ${payload.entityId}`
        );
      } else {
        console.error(
          '[Club Listener] Error in recruitment:candidate_selected listener:',
          err
        );
      }
    }
  });
}
