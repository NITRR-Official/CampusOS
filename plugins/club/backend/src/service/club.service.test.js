import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { User } from '@campusos/backend-core/database/schemas/user.schema.js';
import { Club } from '../schema/club.model.js';
import { ClubMember } from '../schema/clubMember.model.js';
import { Role as ClubRole } from '../schema/role.model.js';
import { createClubRepository } from '../repository/club.repository.js';
import { createClubService } from './club.service.js';

describe('ClubService', () => {
  let service;
  let mongoServer;
  let repository;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  }, 120000);

  beforeEach(async () => {
    await User.deleteMany({});
    await Club.deleteMany({});
    await ClubMember.deleteMany({});
    await ClubRole.deleteMany({});

    repository = createClubRepository(Club, ClubMember, ClubRole, User);
    eventBus = { emit: vi.fn() };
    service = createClubService(repository, eventBus);
  });

  describe('createClub', () => {
    it('should create a club and emit an event', async () => {
      const payload = {
        name: 'Coding Club',
        email: 'coding@test.com',
        instituteId: 'inst_1',
        description: 'A club for coding',
        category: 'Technical',
        createdBy: 'user_1'
      };

      const club = await service.createClub(payload);

      expect(club).toBeDefined();
      expect(club.name).toBe('Coding Club');
      expect(club.slug).toBe('coding-club'); // auto generated
      expect(club.status).toBe('pending_verification');
      expect(eventBus.emit).toHaveBeenCalledWith(
        'club.proposed',
        expect.any(Object)
      );
    });
  });

  describe('updateClubStatus', () => {
    it('should approve club and provision roles and owner account', async () => {
      const payload = {
        name: 'Robotics Club',
        email: 'robotics@test.com',
        instituteId: 'inst_1',
        description: 'Robotics',
        category: 'Technical',
        createdBy: 'user_1'
      };

      const club = await service.createClub(payload);

      const approvedClub = await service.updateClubStatus(club.id, 'approved');

      expect(approvedClub.status).toBe('approved');

      // Check roles provisioned
      const roles = await ClubRole.find({ clubId: club.id });
      expect(roles.length).toBeGreaterThan(0);
      const ownerRole = roles.find((r) => r.name === 'owner');
      expect(ownerRole).toBeDefined();

      // Check owner account provisioned
      const ownerUser = await User.findOne({ email: 'robotics@test.com' });
      expect(ownerUser).toBeDefined();
      expect(ownerUser.name).toBe('Robotics Club (Official)');

      // Check member relation
      const member = await ClubMember.findOne({
        clubId: club.id,
        userId: ownerUser._id
      });
      expect(member).toBeDefined();
      expect(member.roles).toContainEqual(ownerRole._id);
    });
  });

  describe('listClubs & getClub', () => {
    it('should fetch club details correctly', async () => {
      const club1 = await service.createClub({
        name: 'Club 1',
        email: 'c1@test.com',
        instituteId: 'inst_1',
        createdBy: 'user_1'
      });
      const club2 = await service.createClub({
        name: 'Club 2',
        email: 'c2@test.com',
        instituteId: 'inst_1',
        createdBy: 'user_1'
      });

      await service.updateClubStatus(club1.id, 'approved');

      const allClubs = await service.listClubs();
      expect(allClubs).toHaveLength(2);

      const approvedClubs = await service.listClubs('approved');
      expect(approvedClubs).toHaveLength(1);
      expect(approvedClubs[0].id.toString()).toBe(club1.id.toString());

      const fetched = await service.getClub(club1.id);
      expect(fetched).toBeDefined();
      expect(fetched.name).toBe('Club 1');
    });
  });

  describe('members management', () => {
    it('should add a member and list members', async () => {
      const club = await service.createClub({
        name: 'Member Club',
        email: 'member@test.com',
        instituteId: 'inst_1',
        createdBy: 'user_1'
      });
      await service.updateClubStatus(club.id, 'approved');

      const ownerRole = await ClubRole.findOne({
        clubId: club.id,
        name: 'owner'
      });

      // Create a test user first
      await User.create({
        name: 'Test Member',
        email: 'test_user2@example.com',
        passwordHash: 'dummy'
      });

      // Add another member as super admin
      await service.addMember(
        club.id,
        {
          email: 'test_user2@example.com',
          role: ownerRole._id.toString()
        },
        { isSuperAdmin: true }
      );

      const members = await service.listMembers(club.id);

      expect(members.length).toBe(2); // One is the provisioned owner, one is the new member

      const newMember = members.find(
        (m) => m.userId.email === 'test_user2@example.com'
      );
      expect(newMember).toBeDefined();
      expect(
        newMember.roles.some(
          (r) => r._id.toString() === ownerRole._id.toString()
        )
      ).toBeTruthy();
    });
  });
});
