import { RequestContext } from '@campus-os/shared/request-context';
import { Resource } from '../schema/resource.model.js';

export function createResourceRepository() {
  return {
    async create(data) {
      const created = await Resource.create(data);
      if (created && created._id) {
        RequestContext.set(
          `resource:${created._id.toString()}`,
          created.toObject ? created.toObject() : created
        );
      }
      return created;
    },

    async findById(id) {
      if (!id) return null;
      return RequestContext.computeIfAbsent(`resource:${id}`, async () => {
        return await Resource.findById(id).lean().exec();
      });
    },

    async find(query) {
      return await Resource.find(query).lean().exec();
    },

    async findDocuments(query) {
      return await Resource.find(query).exec();
    },

    async findDocumentById(id) {
      return await Resource.findById(id).exec();
    },

    async findOneDocument(query) {
      return await Resource.findOne(query).exec();
    },

    async updateById(id, updates) {
      const updated = await Resource.findByIdAndUpdate(id, updates, {
        returnDocument: 'after',
        runValidators: true
      }).exec();
      if (updated) {
        RequestContext.set(
          `resource:${id}`,
          updated.toObject ? updated.toObject() : updated
        );
      } else {
        RequestContext.delete(`resource:${id}`);
      }
      return updated;
    },

    async deleteById(id) {
      RequestContext.delete(`resource:${id}`);
      return await Resource.findByIdAndDelete(id).exec();
    },

    async saveDocument(doc) {
      const saved = await doc.save();
      if (saved && saved._id) {
        RequestContext.delete(`resource:${saved._id.toString()}`);
      }
      return saved;
    },

    async deleteByOwner(owner) {
      return await Resource.deleteMany({ owner }).exec();
    }
  };
}

export default createResourceRepository;
