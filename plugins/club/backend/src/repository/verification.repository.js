export function createVerificationRepository(VerificationToken) {
  async function createVerificationToken(hashedToken, clubId, expiresAt) {
    return VerificationToken.create({
      token: hashedToken,
      clubId,
      expiresAt
    });
  }

  async function findVerificationToken(hashedToken) {
    return VerificationToken.findOne({ token: hashedToken }).lean();
  }

  async function deleteVerificationToken(tokenId) {
    return VerificationToken.deleteOne({ _id: tokenId });
  }

  return {
    createVerificationToken,
    findVerificationToken,
    deleteVerificationToken
  };
}

export default createVerificationRepository;
