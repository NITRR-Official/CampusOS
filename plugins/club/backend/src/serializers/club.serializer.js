export function toIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function serializeClub(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    name: doc.name,
    slug: doc.slug,
    email: doc.email,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    createdBy: doc.createdBy,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt)
  };
}

export function serializeClubMember(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    userId: doc.userId,
    clubId: doc.clubId,
    roles: doc.roles || [],
    joinedAt: toIso(doc.joinedAt)
  };
}
