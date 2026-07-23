import crypto from 'node:crypto';
import { DEFAULT_ROLES } from '../constants/default-roles.js';

export function createProvisioningService(clubRepository, authService) {
  async function provisionDefaultRoles(clubId, session) {
    const rolesData = DEFAULT_ROLES.map((role) => ({
      ...role,
      clubId
    }));
    return clubRepository.createRoles(rolesData, { session });
  }

  async function provisionOwnerAccount(club, session) {
    let ownerUser = await authService.getUserByEmail(club.email);

    if (!ownerUser) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      ownerUser = await authService.createUser({
        name: `${club.name} (Official)`,
        email: club.email,
        password: randomPassword
      });
    }

    const ownerRole = await clubRepository.findRoleByName(club._id, 'owner', {
      session
    });
    if (ownerRole) {
      await clubRepository.addRoleToMember(
        club._id,
        ownerUser._id || ownerUser.id,
        ownerRole._id,
        { session }
      );
    }

    if (club.createdBy && club.createdBy !== 'unknown') {
      const creator = await authService.getUserById(club.createdBy);
      if (creator) {
        const adminRole = await clubRepository.findRoleByName(
          club._id,
          'admin',
          { session }
        );
        if (adminRole) {
          await clubRepository.addRoleToMember(
            club._id,
            creator._id || creator.id,
            adminRole._id,
            { session }
          );
        }
      }
    }
  }

  return {
    provisionDefaultRoles,
    provisionOwnerAccount
  };
}

export default createProvisioningService;
