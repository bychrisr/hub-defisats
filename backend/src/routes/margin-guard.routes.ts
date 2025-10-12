import { Router } from 'express';
import { MarginGuardController } from '../controllers/margin-guard.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const marginGuardController = new MarginGuardController(prisma);

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @route POST /api/user/margin-guard
 * @desc Criar ou atualizar configuração do Margin Guard
 * @access Private
 */
router.post('/', async (req, res) => {
  await marginGuardController.createOrUpdateConfig(req, res);
});

/**
 * @route GET /api/user/margin-guard
 * @desc Buscar configuração atual do Margin Guard
 * @access Private
 */
router.get('/', async (req, res) => {
  await marginGuardController.getConfig(req, res);
});

/**
 * @route GET /api/user/margin-guard/plan-features
 * @desc Buscar features do plano atual
 * @access Private
 */
router.get('/plan-features', async (req, res) => {
  await marginGuardController.getPlanFeatures(req, res);
});

/**
 * @route GET /api/user/margin-guard/positions
 * @desc Buscar posições running do usuário
 * @access Private
 */
router.get('/positions', async (req, res) => {
  await marginGuardController.getRunningPositions(req, res);
});

/**
 * @route POST /api/user/margin-guard/preview
 * @desc Preview de cálculo do Margin Guard
 * @access Private
 */
router.post('/preview', async (req, res) => {
  await marginGuardController.previewCalculation(req, res);
});

/**
 * @route GET /api/user/margin-guard/executions
 * @desc Buscar execuções do Margin Guard
 * @access Private
 */
router.get('/executions', async (req, res) => {
  await marginGuardController.getExecutions(req, res);
});

/**
 * @route GET /api/user/margin-guard/executions/:id
 * @desc Buscar detalhes de uma execução específica
 * @access Private
 */
router.get('/executions/:id', async (req, res) => {
  // TODO: Implementar endpoint de detalhes de execução
  res.status(501).json({ error: 'Endpoint em desenvolvimento' });
});

/**
 * @route GET /api/user/margin-guard/statistics
 * @desc Buscar estatísticas do Margin Guard
 * @access Private
 */
router.get('/statistics', async (req, res) => {
  await marginGuardController.getStatistics(req, res);
});

/**
 * @route GET /api/user/margin-guard/monitored
 * @desc Buscar posições sendo monitoradas
 * @access Private
 */
router.get('/monitored', async (req, res) => {
  await marginGuardController.getMonitoredPositions(req, res);
});

/**
 * @route GET /api/user/margin-guard/available-upgrades
 * @desc Buscar planos de upgrade disponíveis
 * @access Private
 */
router.get('/available-upgrades', async (req, res) => {
  await marginGuardController.getAvailableUpgrades(req, res);
});

export default router;
