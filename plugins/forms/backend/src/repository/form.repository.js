export function createFormRepository(FormModel) {
  return {
    async create(data) {
      const form = new FormModel(data);
      await form.save();
      return form;
    },

    async findById(id) {
      return await FormModel.findById(id).lean();
    },

    async findAll({ limit = 100, skip = 0 } = {}) {
      return await FormModel.find().skip(skip).limit(limit).lean();
    },

    async findByEntity(entityType, entityId) {
      return await FormModel.find({ entityType, entityId }).lean();
    },

    async update(id, data) {
      return await FormModel.findByIdAndUpdate(id, data, {
        returnDocument: 'after',
        runValidators: true
      }).lean();
    }
  };
}
