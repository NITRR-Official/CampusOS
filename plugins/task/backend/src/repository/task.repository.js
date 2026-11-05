import { RequestContext } from '@campus-os/shared/request-context';
import { Task } from '../schema/task.model.js';

export function createTaskRepository() {
  return {
    async create(data) {
      const created = await Task.create(data);
      if (created && created._id) {
        RequestContext.set(
          `task:${created._id.toString()}`,
          created.toObject ? created.toObject() : created
        );
      }
      return created;
    },

    async findById(id) {
      if (!id) return null;
      return RequestContext.computeIfAbsent(`task:${id}`, async () => {
        return await Task.findById(id).lean().exec();
      });
    },

    async find(query, options = {}) {
      const dbQuery = Task.find(query).lean();
      if (options.sort) dbQuery.sort(options.sort);
      return await dbQuery.exec();
    },

    async findDocuments(query) {
      return await Task.find(query).exec();
    },

    async findDocumentById(id) {
      return await Task.findById(id).exec();
    },

    async findOneDocument(query) {
      return await Task.findOne(query).exec();
    },

    async updateById(id, updates) {
      const updated = await Task.findByIdAndUpdate(id, updates, {
        returnDocument: 'after'
      }).exec();
      if (updated) {
        RequestContext.set(
          `task:${id}`,
          updated.toObject ? updated.toObject() : updated
        );
      } else {
        RequestContext.delete(`task:${id}`);
      }
      return updated;
    },

    async deleteById(id) {
      RequestContext.delete(`task:${id}`);
      return await Task.findByIdAndDelete(id).exec();
    },

    async saveDocument(doc) {
      const saved = await doc.save();
      if (saved && saved._id) {
        RequestContext.delete(`task:${saved._id.toString()}`);
      }
      return saved;
    },

    async deleteByClubId(clubId) {
      return await Task.deleteMany({ clubId }).exec();
    },

    async unassignByUserId(userId) {
      return await Task.updateMany(
        { $or: [{ assigneeId: userId }, { createdBy: userId }] },
        { $set: { assigneeName: null, assigneeId: null } }
      ).exec();
    }
  };
}

export default createTaskRepository;
