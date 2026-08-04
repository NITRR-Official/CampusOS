import Vendor from '../schema/vendor.model.js';

export class VendorRepository {
  async create(data) {
    return await Vendor.create(data);
  }

  async findById(id) {
    return await Vendor.findById(id).lean();
  }

  async findOne(query) {
    return await Vendor.findOne(query).lean();
  }

  async find(query) {
    return await Vendor.find(query).lean();
  }

  async findDocuments(query) {
    return await Vendor.find(query);
  }

  async updateById(id, updates) {
    return await Vendor.findByIdAndUpdate(id, updates, {
      returnDocument: 'after',
      runValidators: true
    });
  }

  async deleteById(id) {
    return await Vendor.findByIdAndDelete(id);
  }

  async findDocumentById(id) {
    return await Vendor.findById(id); // Returns full Mongoose document (not lean) for save() calls
  }

  async findDocumentByAssignmentId(assignmentId) {
    return await Vendor.findOne({ 'assignments.assignmentId': assignmentId });
  }

  async saveDocument(doc) {
    return await doc.save();
  }
}

export default VendorRepository;
