import User from '../models/User.js';

/**
 * Bootstrap Initial System Administrator
 * Enforces requirement: Admin registration is NOT publicly exposed in the registration API.
 * Admin account is provisioned via environment variables securely on server boot if none exists.
 */
export const seedInitialAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const email = process.env.ADMIN_INITIAL_EMAIL || 'admin@campus.edu';
      const password = process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePass@2026';
      const name = process.env.ADMIN_INITIAL_NAME || 'Campus Administrator';
      const department = process.env.ADMIN_INITIAL_DEPT || 'Administration';

      await User.create({
        name,
        email,
        password,
        role: 'admin',
        department,
        year: 1,
        semester: 1,
        interests: ['Campus Administration', 'Event Governance'],
        skills: ['Leadership', 'Policy Enforcement'],
        isActive: true
      });

      console.log(`[Bootstrap] Initial System Admin created successfully: ${email}`);
    }
  } catch (error) {
    console.error(`[Bootstrap] Error seeding initial admin: ${error.message}`);
  }
};
