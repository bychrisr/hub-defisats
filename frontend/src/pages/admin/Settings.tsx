/**
 * Admin Settings Page
 * 
 * Página de configurações do sistema para administradores
 */

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Settings, 
  Key, 
  Database, 
  Server, 
  TestTube,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface LNMarketsSettings {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  testnet: boolean;
  baseUrl: string;
}

interface SystemSettings {
  lnMarkets: LNMarketsSettings;
  system: {
    environment: string;
    version: string;
    debug: boolean;
  };
  database: {
    url: string;
    maxConnections: string;
  };
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [lnMarketsForm, setLnMarketsForm] = useState({
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    testnet: false
  });
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/settings/settings');
      
      if (response.data.success) {
        setSettings(response.data.data);
        
        // Pre-fill form with masked values
        setLnMarketsForm({
          apiKey: response.data.data.lnMarkets.apiKey,
          apiSecret: response.data.data.lnMarkets.apiSecret,
          passphrase: response.data.data.lnMarkets.passphrase,
          testnet: response.data.data.lnMarkets.testnet
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleLNMarketsUpdate = async () => {
    try {
      setSaving(true);
      
      const response = await api.put('/api/admin/settings/lnmarkets', lnMarketsForm);
      
      if (response.data.success) {
        toast.success('Configurações do LN Markets atualizadas com sucesso!');
        await fetchSettings(); // Refresh settings
      }
    } catch (error: any) {
      console.error('Failed to update LN Markets settings:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await api.post('/api/admin/settings/lnmarkets/test', lnMarketsForm);
      
      if (response.data.success) {
        setTestResult({
          success: true,
          data: response.data.data
        });
        toast.success('Conexão com LN Markets testada com sucesso!');
      }
    } catch (error: any) {
      console.error('Failed to test LN Markets connection:', error);
      setTestResult({
        success: false,
        error: error.response?.data?.message || 'Erro ao testar conexão'
      });
      toast.error('Falha ao testar conexão com LN Markets');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Configurações do Sistema</h1>
        <p className="text-text-secondary">Gerencie as configurações e credenciais do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LN Markets Settings */}
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Key className="w-6 h-6 text-orange-400 mr-3" />
            <h2 className="text-xl font-semibold text-text-primary">LN Markets</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={lnMarketsForm.apiKey}
                  onChange={(e) => setLnMarketsForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Digite sua API Key do LN Markets"
                />
                <button
                  type="button"
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                API Secret
              </label>
              <input
                type={showCredentials ? 'text' : 'password'}
                value={lnMarketsForm.apiSecret}
                onChange={(e) => setLnMarketsForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Digite sua API Secret do LN Markets"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Passphrase
              </label>
              <input
                type={showCredentials ? 'text' : 'password'}
                value={lnMarketsForm.passphrase}
                onChange={(e) => setLnMarketsForm(prev => ({ ...prev, passphrase: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Digite sua Passphrase do LN Markets"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="testnet"
                checked={lnMarketsForm.testnet}
                onChange={(e) => setLnMarketsForm(prev => ({ ...prev, testnet: e.target.checked }))}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
              />
              <label htmlFor="testnet" className="text-sm text-text-secondary">
                Usar Testnet
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleLNMarketsUpdate}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </button>

              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50"
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Testar Conexão
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mr-2" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {testResult.success ? 'Conexão Bem-sucedida' : 'Falha na Conexão'}
                  </span>
                </div>
                {testResult.success && testResult.data && (
                  <div className="text-sm text-text-secondary">
                    <p>Preço atual: ${testResult.data.marketData.price}</p>
                    <p>Mudança 24h: {testResult.data.marketData.change24h}%</p>
                    <p>Testnet: {testResult.data.testnet ? 'Sim' : 'Não'}</p>
                  </div>
                )}
                {!testResult.success && (
                  <p className="text-sm text-red-400">{testResult.error}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Server className="w-6 h-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-text-primary">Informações do Sistema</h2>
          </div>

          {settings && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Ambiente
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-text-primary">
                  {settings.system.environment}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Versão
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-text-primary">
                  {settings.system.version}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Debug Mode
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-text-primary">
                  {settings.system.debug ? 'Ativado' : 'Desativado'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Database URL
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-text-primary font-mono text-sm">
                  {settings.database.url}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Connections
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-text-primary">
                  {settings.database.maxConnections}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;