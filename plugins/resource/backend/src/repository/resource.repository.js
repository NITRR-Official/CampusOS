import { Resource } from '../schema/resource.model.js';

export function createResourceRepository() {
  return {
    async create(data) {
      return await Resource.create(data);
    },

    async findById(id) {
      return await Resource.findById(id).lean().exec();
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
      return await Resource.findByIdAndUpdate(id, updates, {
        returnDocument: 'after',
        runValidators: true
      }).exec();
    },

    async deleteById(id) {
      return await Resource.findByIdAndDelete(id).exec();
    },

    async saveDocument(doc) {
      return await doc.save();
    }
  };
}

export default createResourceRepository;
