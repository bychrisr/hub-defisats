/**
 * Utility functions for generating unique test data
 * This helps avoid conflicts during development and testing
 */

export const generateUniqueEmail = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}@example.com`;
};

export const generateUniqueUsername = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`;
};

export const generateTestCredentials = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return {
    email: generateUniqueEmail(),
    username: generateUniqueUsername(),
    ln_markets_api_key: `test_api_key_${timestamp}_${random}`,
    ln_markets_api_secret: `test_api_secret_${timestamp}_${random}`,
    ln_markets_passphrase: `testpassphrase_${timestamp}`
  };
};
