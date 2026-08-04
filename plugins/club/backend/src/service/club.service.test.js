import { MongoMemoryReplSet } from 'mongodb-memory-server';
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
import { createRoleService } from './role.service.js';
import { createMemberService } from './member.service.js';
import { createProvisioningService } from './provisioning.service.js';

describe('ClubService Refactored', () => {
  let clubService;
  let memberService;
  let roleService;
  let mongoServer;
  let repository;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
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

    await User.createCollection();
    await Club.createCollection();
    await ClubMember.createCollection();
    await ClubRole.createCollection();

    repository = createClubRepository(Club, ClubMember, ClubRole, User);
    eventBus = { emit: vi.fn() };

    const authService = {
      getUserByEmail: vi.fn(async (email) => User.findOne({ email })),
      createUser: vi.fn(async (data) =>
        User.create({ ...data, passwordHash: data.password || 'hashed' })
      ),
      getUserById: vi.fn(async (id) => User.findById(id)),
      getUsersByIds: vi.fn(async (ids) => User.find({ _id: { $in: ids } }))
    };

    roleService = createRoleService(repository);
    memberService = createMemberService(repository, authService);
    const provisioningService = createProvisioningService(
      repository,
      authService
    );

    clubService = createClubService(repository, eventBus, provisioningService);
  });

  describe('createClub', () => {
    it('should create a club and emit an event', async () => {
      const payload = {
        name: 'Coding Club',
        email: 'coding@test.com',
        description: 'A club for coding',
        category: 'Technical',
        createdBy: '507f1f77bcf86cd799439011'
      };

      const club = await clubService.createClub(payload);

      expect(club).toBeDefined();
      expect(club.name).toBe('Coding Club');
      expect(club.slug).toBe('coding-club'); // auto generated
      expect(club.status).toBe('pending_verification');
      expect(eventBus.emit).toHaveBeenCalledWith(
        'club:proposed',
        expect.any(Object)
      );
    });

    it('should generate a unique slug on duplicate names', async () => {
      const payload = {
        name: 'Coding Club',
        email: 'coding@test.com',
        createdBy: '507f1f77bcf86cd799439011'
      };

      await clubService.createClub(payload);
      const secondClub = await clubService.createClub(payload);

      expect(secondClub.slug).toBe('coding-club-1');
    });
  });

  describe('approveClub', () => {
    it('should approve club and provision roles and owner account', async () => {
      const payload = {
        name: 'Robotics Club',
        email: 'robotics@test.com',
        description: 'Robotics',
        category: 'Technical',
        createdBy: '507f1f77bcf86cd799439011'
      };

      const club = await clubService.createClub(payload);

      const approvedClub = await clubService.approveClub(club.id);

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
      expect(member.roles.map(String)).toContainEqual(ownerRole._id.toString());
    });
  });

  describe('listClubs & getClub', () => {
    it('should fetch club details correctly', async () => {
      const club1 = await clubService.createClub({
        name: 'Club 1',
        email: 'c1@test.com',
        createdBy: '507f1f77bcf86cd799439011'
      });
      const club2 = await clubService.createClub({
        name: 'Club 2',
        email: 'c2@test.com',
        createdBy: '507f1f77bcf86cd799439011'
      });

      await clubService.approveClub(club1.id);

      const allClubs = await clubService.listClubs();
      expect(allClubs).toHaveLength(2);

      const approvedClubs = await clubService.listClubs('approved');
      expect(approvedClubs).toHaveLength(1);
      expect(approvedClubs[0].id.toString()).toBe(club1.id.toString());

      const fetched = await clubService.getClub(club1.id);
      expect(fetched).toBeDefined();
      expect(fetched.name).toBe('Club 1');
    });
  });

  describe('members management', () => {
    it('should add a member and list members', async () => {
      const club = await clubService.createClub({
        name: 'Member Club',
        email: 'member@test.com',
        createdBy: '507f1f77bcf86cd799439011'
      });
      await clubService.approveClub(club.id);

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

      // Add member using memberService
      await memberService.addMember(
        club.id,
        { email: 'test_user2@example.com' },
        ownerRole
      );

      const members = await memberService.listMembers(club.id);

      expect(members.length).toBe(2); // One is the provisioned owner, one is the new member

      const newMember = members.find(
        (m) => m.user && m.user.email === 'test_user2@example.com'
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
