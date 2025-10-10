import crypto from 'crypto';
import axios from 'axios';

export class HIBPService {
  private readonly apiUrl = 'https://api.pwnedpasswords.com/range';

  /**
   * Check if password has been compromised using k-Anonymity
   * @param password - The password to check
   * @returns Promise<boolean> - true if password is compromised
   */
  async isPasswordCompromised(password: string): Promise<boolean> {
    try {
      // Create SHA-1 hash of the password
      const sha1Hash = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();

      // Get first 5 characters (prefix) and remaining characters (suffix)
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      // Make request to HIBP API with only the prefix
      const response = await axios.get(`${this.apiUrl}/${prefix}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Axisor-Security-Check',
        },
      });

      // Parse the response to check if our suffix exists
      const hashList = response.data;
      const lines = hashList.split('\n');

      for (const line of lines) {
        const [hashSuffix] = line.split(':');
        if (hashSuffix === suffix) {
          return true; // Password is compromised
        }
      }

      return false; // Password is not compromised
    } catch (error) {
      // If HIBP service is unavailable, log the error but don't block registration
      console.error('HIBP service error:', error);
      return false; // Allow registration if service is down
    }
  }

  /**
   * Get password breach count
   * @param password - The password to check
   * @returns Promise<number> - Number of times password was found in breaches
   */
  async getPasswordBreachCount(password: string): Promise<number> {
    try {
      const sha1Hash = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      const response = await axios.get(`${this.apiUrl}/${prefix}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Axisor-Security-Check',
        },
      });

      const hashList = response.data;
      const lines = hashList.split('\n');

      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          return parseInt(count, 10);
        }
      }

      return 0;
    } catch (error) {
      console.error('HIBP service error:', error);
      return 0;
    }
  }
}
