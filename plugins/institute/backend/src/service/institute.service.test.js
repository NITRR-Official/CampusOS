import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { Institute } from '../schema/institute.model.js';
import { getInstituteService } from './institute.service.js';

describe('InstituteService', () => {
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
    await Institute.deleteMany({});
    service = getInstituteService();
  });

  describe('createInstitute', () => {
    it('should create a new institute', async () => {
      const payload = {
        name: 'NIT Raipur',
        code: 'NITRR',
        description: 'National Institute of Technology',
        location: 'Raipur, India',
        createdBy: 'admin_user_id'
      };

      const institute = await service.createInstitute(payload);
      expect(institute).toBeDefined();
      expect(institute.name).toBe('NIT Raipur');
      expect(institute.code).toBe('NITRR');
      expect(institute.createdBy).toBe('admin_user_id');
    });
  });

  describe('listInstitutes', () => {
    it('should list all institutes', async () => {
      await service.createInstitute({ name: 'Institute 1', createdBy: 'u1' });
      await service.createInstitute({ name: 'Institute 2', createdBy: 'u2' });

      const institutes = await service.listInstitutes();
      expect(institutes).toHaveLength(2);
      expect(institutes[0].name).toBe('Institute 1');
      expect(institutes[1].name).toBe('Institute 2');
    });
  });
});
