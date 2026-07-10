/**
 * Mail Provider Strategy
 * Defines an interface/implementation for sending emails.
 */

export class MockMailProvider {
  /**
   * Simulates sending a verification email by logging the verification link to the console.
   * @param {string} to - The recipient email address (the club's official email)
   * @param {string} clubName - The name of the club
   * @param {string} token - The secure verification token
   */
  async sendVerificationEmail(to, clubName, token) {
    const verificationUrl = `http://localhost:4000/api/v1/clubs/verify?token=${token}`;
    
    setTimeout(() => {
      console.log('\n\n======================================================');
      console.log(`✉️  MOCK EMAIL SENT TO: ${to}`);
    console.log(`Subject: Verify your Club Proposal for ${clubName}`);
    console.log(`Body:`);
    console.log(`Hello,`);
    console.log(`A proposal was submitted for ${clubName}.`);
    console.log(`Please click the link below to verify this email address and send the proposal for administrative review:`);
    console.log(verificationUrl);
    console.log('======================================================\n\n');
    }, 500);
    
    return Promise.resolve(true);
  }
}

// In a real production scenario, we would determine which provider to use based on env vars
export const mailProvider = new MockMailProvider();
