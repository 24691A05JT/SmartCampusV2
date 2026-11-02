import crypto from 'crypto';

/**
 * Generate a cryptographically secure, human-readable ticket code
 * Format: TKT-YYYY-XXXXXXXX (e.g., TKT-2026-F89A2B1C)
 * @returns {string} Unique ticket code
 */
export const generateTicketCode = () => {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TKT-${year}-${randomHex}`;
};

export default generateTicketCode;
