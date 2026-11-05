import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { createSlugParamHandler } from './slug-resolver.js';

describe('Slug Resolver Middleware (Scoped Param Handler)', () => {
  it('calls next without doing anything if clubId is missing', async () => {
    const handler = createSlugParamHandler({});
    const req = { params: {} };
    const res = {};
    const next = vi.fn();

    await handler(req, res, next, undefined);

    expect(next).toHaveBeenCalledWith();
  });

  it('resolves club by slug, normalizes req.params.clubId and attaches contexts without mutating body/query', async () => {
    const objectId = new mongoose.Types.ObjectId();
    const mockClub = {
      _id: objectId,
      name: 'Robotics Club',
      slug: 'robotics-club',
      status: 'approved'
    };

    const mockClubModel = {
      findOne: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockClub)
      })
    };

    const handler = createSlugParamHandler(mockClubModel);
    const req = {
      params: { clubId: 'robotics-club' },
      query: { clubId: 'robotics-club' },
      body: { clubId: 'robotics-club', extra: 'data' }
    };
    const res = {};
    const next = vi.fn();

    await handler(req, res, next, 'robotics-club');

    expect(mockClubModel.findOne).toHaveBeenCalledWith({
      slug: 'robotics-club'
    });
    expect(req.params.clubId).toBe(objectId.toString());
    expect(req.clubContext).toEqual(mockClub);
    expect(req.resolvedContext).toEqual({
      type: 'club:member_service',
      id: objectId.toString()
    });

    // Verify immutability of req.query and req.body
    expect(req.query.clubId).toBe('robotics-club');
    expect(req.body.clubId).toBe('robotics-club');

    expect(next).toHaveBeenCalledWith();
  });

  it('resolves club by ObjectId when given a valid ObjectId', async () => {
    const objectId = new mongoose.Types.ObjectId();
    const mockClub = {
      _id: objectId,
      name: 'Coding Club',
      slug: 'coding-club',
      status: 'approved'
    };

    const mockClubModel = {
      findOne: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockClub)
      })
    };

    const handler = createSlugParamHandler(mockClubModel);
    const req = {
      params: { clubId: objectId.toString() }
    };
    const res = {};
    const next = vi.fn();

    await handler(req, res, next, objectId.toString());

    expect(mockClubModel.findOne).toHaveBeenCalledWith({
      $or: [{ _id: objectId.toString() }, { slug: objectId.toString() }]
    });
    expect(req.params.clubId).toBe(objectId.toString());
    expect(req.clubContext).toEqual(mockClub);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with 404 AppError if club is not found', async () => {
    const mockClubModel = {
      findOne: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })
    };

    const handler = createSlugParamHandler(mockClubModel);
    const req = {
      params: { clubId: 'non-existent' }
    };
    const res = {};
    const next = vi.fn();

    await handler(req, res, next, 'non-existent');

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        code: 'NOT_FOUND'
      })
    );
  });
});
