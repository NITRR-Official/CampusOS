export function createCampaignRepository(CampaignModel) {
  return {
    async create(data) {
      const campaign = new CampaignModel(data);
      await campaign.save();
      return campaign;
    },

    async findById(id) {
      return await CampaignModel.findById(id).lean();
    },

    async findAll() {
      return await CampaignModel.find().lean();
    },

    async findByEntity(entityType, entityId) {
      return await CampaignModel.find({ entityType, entityId }).lean();
    },

    async findByFormId(formId, status) {
      const query = { formId };
      if (status) query.status = status;
      return await CampaignModel.findOne(query).lean();
    },

    async update(id, data) {
      return await CampaignModel.findByIdAndUpdate(id, data, {
        returnDocument: 'after',
        runValidators: true
      });
    }
  };
}
