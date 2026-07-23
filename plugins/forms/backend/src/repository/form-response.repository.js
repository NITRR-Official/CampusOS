export function createFormResponseRepository(FormResponseModel) {
  return {
    async create(data) {
      const response = new FormResponseModel(data);
      await response.save();
      return response;
    },

    async findByFormId(formId) {
      return await FormResponseModel.find({ formId }).lean();
    },

    async exists(query) {
      return await FormResponseModel.exists(query);
    },

    async findById(responseId) {
      return await FormResponseModel.findById(responseId).lean();
    }
  };
}
