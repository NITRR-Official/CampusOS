import { RequestContext } from '@campus-os/shared/request-context';
import Vendor from '../schema/vendor.model.js';

export class VendorRepository {
  async create(data) {
    const created = await Vendor.create(data);
    if (created && created._id) {
      RequestContext.set(
        `vendor:${created._id.toString()}`,
        created.toObject ? created.toObject() : created
      );
    }
    return created;
  }

  async findById(id) {
    if (!id) return null;
    return RequestContext.computeIfAbsent(`vendor:${id}`, async () => {
      return await Vendor.findById(id).lean();
    });
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
    const updated = await Vendor.findByIdAndUpdate(id, updates, {
      returnDocument: 'after',
      runValidators: true
    });
    if (updated) {
      RequestContext.set(
        `vendor:${id}`,
        updated.toObject ? updated.toObject() : updated
      );
    } else {
      RequestContext.delete(`vendor:${id}`);
    }
    return updated;
  }

  async deleteById(id) {
    RequestContext.delete(`vendor:${id}`);
    return await Vendor.findByIdAndDelete(id);
  }

  async findDocumentById(id) {
    return await Vendor.findById(id); // Returns full Mongoose document (not lean) for save() calls
  }

  async findDocumentByAssignmentId(assignmentId) {
    return await Vendor.findOne({ 'assignments.assignmentId': assignmentId });
  }

  async saveDocument(doc) {
    const saved = await doc.save();
    if (saved && saved._id) {
      RequestContext.delete(`vendor:${saved._id.toString()}`);
    }
    return saved;
  }

  async deleteByClubId(clubId) {
    return await Vendor.deleteMany({ clubId });
  }
}

export default VendorRepository;
