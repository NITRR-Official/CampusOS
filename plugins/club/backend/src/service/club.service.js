import { AppError } from '@campus-os/shared/errors';
import { serializeClub } from '../serializers/club.serializer.js';
import { createWithUniqueSlug } from '../utils/slug-generator.js';
import { pick } from '../utils/object.utils.js';
import {
  ClubStatus,
  ClubEvents,
  ClubCategories
} from '../constants/club.constants.js';

export function createClubService(
  clubRepository,
  eventBus,
  provisioningService
) {
  async function createClub({ name, email, description, category, createdBy }) {
    const club = await createWithUniqueSlug(name, async (slug) => {
      return clubRepository.createClub({
        name,
        slug,
        email,
        description: description || null,
        category: category || ClubCategories.GENERAL,
        status: ClubStatus.PENDING_VERIFICATION,
        createdBy
      });
    });

    if (eventBus) {
      eventBus.emit(ClubEvents.PROPOSED, { clubId: club._id, data: club });
      // Emit generic created event for activity timeline
      eventBus.emit('club:created', {
        clubId: club._id,
        data: club,
        entityType: 'club',
        entityId: club._id
      });
    }

    console.info('[ClubService] Club created and proposed', {
      clubId: club._id,
      slug: club.slug,
      createdBy
    });

    return serializeClub(club);
  }

  async function listClubs(status, { page = 1, limit = 50 } = {}) {
    const filter = status ? { status } : {};
    const clubs = await clubRepository.listClubs(filter, { page, limit });
    return clubs.map((club) => ({
      ...serializeClub(club),
      memberCount: club.memberCount || 0
    }));
  }

  async function getClub(clubId) {
    if (!clubId) return null;
    const club = await clubRepository.getClubById(clubId);
    if (!club) return null;
    const memberCount = await clubRepository.countMembers(clubId);
    return { ...serializeClub(club), memberCount };
  }

  async function getClubBySlug(slug) {
    if (!slug) return null;
    const club = await clubRepository.getClubBySlug(slug);
    if (!club) return null;
    const memberCount = await clubRepository.countMembers(club._id);
    return { ...serializeClub(club), memberCount };
  }

  async function approveClub(clubId) {
    const existingRolesCount = await clubRepository.countRoles(clubId);
    let finalClub = null;

    if (existingRolesCount === 0) {
      let createdRoles = [];
      await clubRepository.withTransaction(async (session) => {
        finalClub = await clubRepository.updateClubStatus(
          clubId,
          ClubStatus.APPROVED,
          { session }
        );
        createdRoles = await provisioningService.provisionDefaultRoles(
          clubId,
          session
        );
        await provisioningService.provisionOwnerAccount(finalClub, session);
      });

      if (eventBus && createdRoles.length > 0) {
        const rolesMap = {};
        for (const r of createdRoles) {
          rolesMap[r.name] = r._id.toString();
        }

        eventBus.emit(ClubEvents.ROLES_PROVISIONED, {
          clubId,
          roles: rolesMap
        });
        // Emit generic approved event for activity timeline
        eventBus.emit('club:approved', {
          clubId,
          entityType: 'club',
          entityId: clubId
        });
      }
    } else {
      finalClub = await clubRepository.updateClubStatus(
        clubId,
        ClubStatus.APPROVED
      );
      if (eventBus) {
        eventBus.emit('club:approved', {
          clubId,
          entityType: 'club',
          entityId: clubId
        });
      }
    }

    console.info('[ClubService] Club approved and provisioned', { clubId });
    return serializeClub(finalClub);
  }

  async function rejectClub(clubId) {
    const club = await clubRepository.updateClubStatus(
      clubId,
      ClubStatus.REJECTED
    );
    console.info('[ClubService] Club rejected', { clubId });
    if (eventBus && club) {
      eventBus.emit(ClubEvents.REJECTED, { clubId, data: club });
    }
    return serializeClub(club);
  }

  async function archiveClub(clubId) {
    const club = await clubRepository.updateClubStatus(
      clubId,
      ClubStatus.ARCHIVED
    );

    if (eventBus && club) {
      eventBus.emit(ClubEvents.ARCHIVED, { clubId, data: club });
    }

    console.info('[ClubService] Club archived', { clubId });
    return serializeClub(club);
  }

  async function restoreClub(clubId) {
    const club = await clubRepository.updateClubStatus(
      clubId,
      ClubStatus.APPROVED
    );
    console.info('[ClubService] Club restored from archive', { clubId });
    if (eventBus && club) {
      // Emit event for activity timeline and listeners
      eventBus.emit('club:restored', {
        clubId,
        entityType: 'club',
        entityId: clubId
      });
    }
    return serializeClub(club);
  }

  async function updateClubStatus(clubId, status) {
    const club = await clubRepository.updateClubStatus(clubId, status);
    console.info('[ClubService] Club status updated', { clubId, status });
    return serializeClub(club);
  }

  async function updateClub(clubId, payload) {
    // Pick safe fields for update
    const updateData = pick(payload, [
      'name',
      'description',
      'category',
      'email'
    ]);

    if (Object.keys(updateData).length === 0) {
      const club = await clubRepository.getClubById(clubId);
      return serializeClub(club);
    }

    const club = await clubRepository.updateClub(clubId, updateData);
    console.info('[ClubService] Club updated', {
      clubId,
      fieldsUpdated: Object.keys(updateData)
    });
    return serializeClub(club);
  }

  async function deleteClub(clubId) {
    const deleted = await clubRepository.deleteClub(clubId);

    if (deleted && eventBus) {
      eventBus.emit(ClubEvents.DELETED, { clubId, data: null });
    }

    console.info('[ClubService] Club deleted', { clubId });
    return deleted;
  }

  return {
    createClub,
    listClubs,
    getClub,
    getClubBySlug,
    approveClub,
    rejectClub,
    archiveClub,
    restoreClub,
    updateClub,
    updateClubStatus,
    deleteClub
  };
}

export default createClubService;
