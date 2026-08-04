import { Task } from '../schema/task.model.js';

export function createTaskRepository() {
  return {
    async create(data) {
      return await Task.create(data);
    },

    async findById(id) {
      return await Task.findById(id).lean().exec();
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
      return await Task.findByIdAndUpdate(id, updates, {
        returnDocument: 'after'
      }).exec();
    },

    async deleteById(id) {
      return await Task.findByIdAndDelete(id).exec();
    },

    async saveDocument(doc) {
      return await doc.save();
    }
  };
}

export default createTaskRepository;
