export function createCandidateRepository(CandidateModel) {
  return {
    async create(data) {
      const candidate = new CandidateModel(data);
      await candidate.save();
      return candidate;
    },

    async findByCampaignId(campaignId) {
      return await CandidateModel.find({ campaignId });
    },

    async findById(id) {
      return await CandidateModel.findById(id);
    },

    async updateStatus(id, status) {
      return await CandidateModel.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );
    },

    async updateNotes(id, notes) {
      return await CandidateModel.findByIdAndUpdate(
        id,
        { notes },
        { new: true, runValidators: true }
      );
    }
  };
}
