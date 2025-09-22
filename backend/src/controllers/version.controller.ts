import { FastifyRequest, FastifyReply } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';

interface VersionResponse {
  version: string;
  buildTime: string;
  environment: string;
  features: string[];
}

export async function getVersion(request: FastifyRequest, reply: FastifyReply) {
  try {
    console.log('🔍 VERSION CONTROLLER - Getting version info...');
    
    // Lê a versão do package.json
    const packagePath = join(__dirname, '../../package.json');
    console.log('📦 VERSION CONTROLLER - Package path:', packagePath);
    
    let packageJson;
    try {
      packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      console.log('✅ VERSION CONTROLLER - Package.json loaded:', packageJson.version);
    } catch (packageError) {
      console.warn('⚠️ VERSION CONTROLLER - Could not read package.json, using defaults');
      packageJson = { version: '1.0.0' };
    }
    
    // Lê informações de build se existirem
    let buildTime = new Date().toISOString();
    let environment = process.env.NODE_ENV || 'development';
    let features = ['trading', 'analytics', 'admin-panel', 'notifications', 'automation'];
    let version = packageJson.version || '1.0.0';
    
    try {
      const buildInfoPath = join(__dirname, '../../build-info.json');
      console.log('📦 VERSION CONTROLLER - Build info path:', buildInfoPath);
      
      const buildInfo = JSON.parse(readFileSync(buildInfoPath, 'utf8'));
      buildTime = buildInfo.buildTime || buildTime;
      environment = buildInfo.environment || environment;
      features = buildInfo.features || features;
      version = buildInfo.version || version; // Usa a versão do build-info se disponível
      
      console.log('✅ VERSION CONTROLLER - Build info loaded:', {
        version,
        buildTime,
        environment,
        features: features.length
      });
    } catch (buildError) {
      console.warn('⚠️ VERSION CONTROLLER - Could not read build-info.json, using defaults');
    }

    const versionInfo: VersionResponse = {
      version,
      buildTime,
      environment,
      features
    };

    console.log('📦 VERSION CONTROLLER - Final version info:', versionInfo);

    // Adiciona headers para cache
    reply.header('Cache-Control', 'public, max-age=300'); // 5 minutos
    reply.header('ETag', `"${versionInfo.version}-${versionInfo.buildTime}"`);

    return reply.send(versionInfo);
  } catch (error) {
    console.error('❌ VERSION CONTROLLER - Error getting version info:', error);
    request.log.error('Error getting version info:', error);
    return reply.status(500).send({
      error: 'VERSION_ERROR',
      message: 'Failed to get version information',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
