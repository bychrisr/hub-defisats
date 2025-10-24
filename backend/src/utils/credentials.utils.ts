/**
 * Helper utilities for handling credentials
 */

/**
 * Helper para detectar flag isTestnet de credenciais
 * Suporta múltiplos formatos: "true", "false", true, false, "testnet", etc.
 */
export function isTestnetCredentials(credentials: Record<string, any>): boolean {
  return credentials['isTestnet'] === 'true' || 
         credentials['isTestnet'] === true ||
         credentials['testnet'] === 'true' ||
         credentials['testnet'] === true;
}

/**
 * Helper para extrair credenciais principais de forma segura
 */
export function extractMainCredentials(credentials: Record<string, any>): {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  isTestnet: boolean;
} {
  return {
    apiKey: credentials['API Key'] || credentials['api_key'] || credentials['apiKey'] || '',
    apiSecret: credentials['API Secret'] || credentials['api_secret'] || credentials['apiSecret'] || '',
    passphrase: credentials['Passphrase'] || credentials['passphrase'] || '',
    isTestnet: isTestnetCredentials(credentials)
  };
}

