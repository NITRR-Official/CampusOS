import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { User } from '@campusos/backend-core/database/schemas/user.schema.js';
import { createAuthRepository } from '../repository/auth.repository.js';
import { createAuthService } from './auth.service.js';

describe('AuthService', () => {
  let service;
  let mongoServer;

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
    const repository = createAuthRepository(User);
    service = createAuthService(repository);
  });

  describe('createUser', () => {
    it('should create the first user as a super admin', async () => {
      const user = await service.createUser({
        name: 'First User',
        email: 'first@test.com',
        password: 'Password123!'
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('first@test.com');
      expect(user.isSuperAdmin).toBe(true);
      expect(user.name).toBe('First User');
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('should emit user:created event on successful creation', async () => {
      const mockEventBus = { emit: vi.fn() };
      const repository = createAuthRepository(User);
      const serviceWithEvents = createAuthService(repository, mockEventBus);

      await serviceWithEvents.createUser({
        name: 'Event User',
        email: 'event@test.com',
        password: 'Password123!'
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith('user:created', {
        userId: expect.any(String)
      });
    });

    it('should create subsequent users as normal users', async () => {
      await service.createUser({
        name: 'First User',
        email: 'first@test.com',
        password: 'Password123!'
      });

      const secondUser = await service.createUser({
        name: 'Second User',
        email: 'second@test.com',
        password: 'Password123!'
      });

      expect(secondUser).toBeDefined();
      expect(secondUser.email).toBe('second@test.com');
      expect(secondUser.isSuperAdmin).toBe(false);
    });

    it('should throw an error for duplicate emails', async () => {
      await service.createUser({
        name: 'First User',
        email: 'first@test.com',
        password: 'Password123!'
      });

      await expect(
        service.createUser({
          name: 'Duplicate User',
          email: 'first@test.com', // same email
          password: 'Password123!'
        })
      ).rejects.toThrow('Email is already registered');
    });
  });

  describe('authenticateUser', () => {
    beforeEach(async () => {
      await service.createUser({
        name: 'Test User',
        email: 'auth@test.com',
        password: 'ValidPassword123!'
      });
    });

    it('should authenticate with correct credentials', async () => {
      const user = await service.authenticateUser({
        email: 'auth@test.com',
        password: 'ValidPassword123!'
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('auth@test.com');
    });

    it('should return null with incorrect password', async () => {
      const user = await service.authenticateUser({
        email: 'auth@test.com',
        password: 'WrongPassword!'
      });

      expect(user).toBeNull();
    });

    it('should return null with non-existent email', async () => {
      const user = await service.authenticateUser({
        email: 'notfound@test.com',
        password: 'ValidPassword123!'
      });

      expect(user).toBeNull();
    });
  });

  describe('listUsers & deleteUser', () => {
    beforeEach(async () => {
      await service.createUser({
        name: 'User 1',
        email: 'u1@test.com',
        password: 'ValidPassword123!'
      });
      await service.createUser({
        name: 'User 2',
        email: 'u2@test.com',
        password: 'ValidPassword123!'
      });
    });

    it('should list all users without password hashes', async () => {
      const users = await service.listUsers();
      expect(users).toHaveLength(2);
      expect(users[0]).not.toHaveProperty('passwordHash');
      expect(users[1]).not.toHaveProperty('passwordHash');
    });

    it('should delete a user and emit event', async () => {
      const users = await service.listUsers();
      const userId = users[0].id;

      const mockEventBus = { emit: vi.fn() };
      const repository = createAuthRepository(User);
      const serviceWithEvents = createAuthService(repository, mockEventBus);

      const deleted = await serviceWithEvents.deleteUser(userId);

      expect(deleted).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalledWith('user:deleted', {
        userId
      });

      const remainingUsers = await serviceWithEvents.listUsers();
      expect(remainingUsers).toHaveLength(1);
    });
  });
});
