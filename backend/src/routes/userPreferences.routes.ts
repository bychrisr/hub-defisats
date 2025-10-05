import { Router } from 'express';
import { userPreferencesService } from '../services/userPreferences.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/user-preferences/indicators
 * Carrega as preferências de indicadores do usuário
 */
router.get('/indicators', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log(`📦 API - Loading indicator preferences for user: ${userId}`);
    
    const preferences = await userPreferencesService.loadIndicatorPreferences(userId);
    
    if (!preferences) {
      return res.json({ 
        success: true, 
        data: null, 
        message: 'No preferences found' 
      });
    }

    res.json({ 
      success: true, 
      data: preferences,
      message: 'Preferences loaded successfully'
    });

  } catch (error) {
    console.error('❌ API - Error loading preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load preferences' 
    });
  }
});

/**
 * POST /api/user-preferences/indicators
 * Salva as preferências de indicadores do usuário
 */
router.post('/indicators', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { indicatorConfigs } = req.body;
    
    if (!indicatorConfigs || typeof indicatorConfigs !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid indicator configurations' 
      });
    }

    console.log(`💾 API - Saving indicator preferences for user: ${userId}`);
    
    const success = await userPreferencesService.saveIndicatorPreferences(userId, indicatorConfigs);
    
    if (!success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save preferences' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Preferences saved successfully' 
    });

  } catch (error) {
    console.error('❌ API - Error saving preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save preferences' 
    });
  }
});

/**
 * DELETE /api/user-preferences/indicators
 * Remove as preferências de indicadores do usuário
 */
router.delete('/indicators', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log(`🗑️ API - Clearing indicator preferences for user: ${userId}`);
    
    const success = await userPreferencesService.clearIndicatorPreferences(userId);
    
    if (!success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to clear preferences' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Preferences cleared successfully' 
    });

  } catch (error) {
    console.error('❌ API - Error clearing preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear preferences' 
    });
  }
});

/**
 * GET /api/user-preferences/sync
 * Sincroniza preferências entre dispositivos
 */
router.get('/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const deviceId = req.headers['x-device-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log(`🔄 API - Syncing preferences for user: ${userId}, device: ${deviceId || 'unknown'}`);
    
    const preferences = await userPreferencesService.syncPreferences(userId, deviceId || 'unknown');
    
    if (!preferences) {
      return res.json({ 
        success: true, 
        data: null, 
        message: 'No preferences to sync' 
      });
    }

    res.json({ 
      success: true, 
      data: preferences,
      message: 'Preferences synced successfully'
    });

  } catch (error) {
    console.error('❌ API - Error syncing preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync preferences' 
    });
  }
});

/**
 * GET /api/user-preferences/export
 * Exporta preferências para backup
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log(`📤 API - Exporting preferences for user: ${userId}`);
    
    const jsonData = await userPreferencesService.exportPreferences(userId);
    
    if (!jsonData) {
      return res.status(404).json({ 
        success: false, 
        error: 'No preferences found to export' 
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-preferences-${userId}.json"`);
    res.send(jsonData);

  } catch (error) {
    console.error('❌ API - Error exporting preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export preferences' 
    });
  }
});

/**
 * POST /api/user-preferences/import
 * Importa preferências de backup
 */
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { jsonData } = req.body;
    
    if (!jsonData || typeof jsonData !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid JSON data' 
      });
    }

    console.log(`📥 API - Importing preferences for user: ${userId}`);
    
    const success = await userPreferencesService.importPreferences(userId, jsonData);
    
    if (!success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to import preferences' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Preferences imported successfully' 
    });

  } catch (error) {
    console.error('❌ API - Error importing preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import preferences' 
    });
  }
});

/**
 * GET /api/user-preferences/stats
 * Obtém estatísticas das preferências
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log(`📊 API - Getting preferences stats for user: ${userId}`);
    
    const stats = await userPreferencesService.getPreferencesStats(userId);
    
    res.json({ 
      success: true, 
      data: stats,
      message: 'Stats retrieved successfully'
    });

  } catch (error) {
    console.error('❌ API - Error getting stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get stats' 
    });
  }
});

export default router;
