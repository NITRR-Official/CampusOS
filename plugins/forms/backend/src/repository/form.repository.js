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

    async findAll() {
      return await FormModel.find().lean();
    },

    async findByEntity(entityType, entityId) {
      return await FormModel.find({ entityType, entityId }).lean();
    },

    async update(id, data) {
      return await FormModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
      }).lean();
    }
  };
}
