import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Device Fingerprinting Utility
 * Gera identificador único do dispositivo do usuário
 */

let fpInstance: any = null;

/**
 * Inicializa o FingerprintJS
 */
async function initFingerprint() {
  if (!fpInstance) {
    fpInstance = await FingerprintJS.load();
  }
  return fpInstance;
}

/**
 * Obtém o fingerprint do dispositivo
 * Retorna um ID único e estável para o navegador/dispositivo
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    
    console.log('🔍 Device fingerprint generated:', result.visitorId);
    return result.visitorId;
  } catch (error) {
    console.error('❌ Error generating fingerprint:', error);
    // Fallback: gerar ID baseado em características do navegador
    return generateFallbackFingerprint();
  }
}

/**
 * Gera fingerprint alternativo se FingerprintJS falhar
 */
function generateFallbackFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ].join('|');

  // Gerar hash simples
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const fallbackId = 'fallback-' + Math.abs(hash).toString(36);
  console.log('⚠️ Using fallback fingerprint:', fallbackId);
  return fallbackId;
}

/**
 * Limpa o cache do fingerprint (forçar recálculo)
 */
export function clearFingerprintCache(): void {
  fpInstance = null;
}


