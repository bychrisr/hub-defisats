import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  TestTube, 
  Mail, 
  MessageSquare, 
  Shield, 
  Zap, 
  Settings as SettingsIcon,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Database,
  Globe,
  Lock,
  Bell,
  Webhook,
  Key,
  Server,
  Activity,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Settings {
  rate_limiting: {
    max_attempts: number;
    window_minutes: number;
  };
  captcha: {
    enabled: boolean;
    site_key: string;
    secret_key: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    enabled: boolean;
  };
  webhooks: {
    slack: {
      url: string;
      channel: string;
      enabled: boolean;
    };
    telegram: {
      bot_token: string;
      chat_id: string;
      enabled: boolean;
    };
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    rate_limiting: {
      max_attempts: 100,
      window_minutes: 60
    },
    captcha: {
      enabled: false,
      site_key: '',
      secret_key: ''
    },
    smtp: {
      host: '',
      port: 587,
      user: '',
      pass: '',
      enabled: false
    },
    webhooks: {
      slack: {
        url: '',
        channel: '',
        enabled: false
      },
      telegram: {
        bot_token: '',
        chat_id: '',
        enabled: false
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Simular carregamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações carregadas com sucesso!');
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type: string) => {
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Teste de conexão ${type} executado com sucesso!`);
    } catch (error) {
      toast.error(`Erro no teste de conexão ${type}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSettings();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Configurações</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos as configurações do sistema...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-3xl"></div>
            <Card className="relative backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                        <SettingsIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Configurações do Sistema
                        </h1>
                        <p className="text-text-secondary">Gerencie as configurações globais da aplicação</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-600/25"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Configurações
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Tabs */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <Tabs defaultValue="security" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 profile-sidebar-glow backdrop-blur-sm bg-background/50 border-border/50">
                  <TabsTrigger 
                    value="security" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Segurança
                  </TabsTrigger>
                  <TabsTrigger 
                    value="email" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger 
                    value="webhooks" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Webhook className="h-4 w-4 mr-2" />
                    Webhooks
                  </TabsTrigger>
                  <TabsTrigger 
                    value="system" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Server className="h-4 w-4 mr-2" />
                    Sistema
                  </TabsTrigger>
                </TabsList>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Rate Limiting */}
                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-blue-500" />
                          Rate Limiting
                        </CardTitle>
                        <CardDescription>
                          Configure limites de requisições para prevenir abuso
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="max_attempts">Máximo de Tentativas</Label>
                            <Input
                              id="max_attempts"
                              type="number"
                              value={settings.rate_limiting.max_attempts}
                              onChange={(e) => setSettings({
                                ...settings,
                                rate_limiting: {
                                  ...settings.rate_limiting,
                                  max_attempts: parseInt(e.target.value)
                                }
                              })}
                              className="backdrop-blur-sm bg-background/50 border-border/50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="window_minutes">Janela (minutos)</Label>
                            <Input
                              id="window_minutes"
                              type="number"
                              value={settings.rate_limiting.window_minutes}
                              onChange={(e) => setSettings({
                                ...settings,
                                rate_limiting: {
                                  ...settings.rate_limiting,
                                  window_minutes: parseInt(e.target.value)
                                }
                              })}
                              className="backdrop-blur-sm bg-background/50 border-border/50"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* CAPTCHA */}
                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-green-500" />
                          CAPTCHA
                        </CardTitle>
                        <CardDescription>
                          Configure proteção contra bots
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="captcha_enabled">Habilitar CAPTCHA</Label>
                          <Switch
                            id="captcha_enabled"
                            checked={settings.captcha.enabled}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              captcha: { ...settings.captcha, enabled: checked }
                            })}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                          />
                        </div>
                        {settings.captcha.enabled && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="site_key">Site Key</Label>
                              <Input
                                id="site_key"
                                value={settings.captcha.site_key}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  captcha: { ...settings.captcha, site_key: e.target.value }
                                })}
                                className="backdrop-blur-sm bg-background/50 border-border/50"
                                placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                              />
                            </div>
                            <div>
                              <Label htmlFor="secret_key">Secret Key</Label>
                              <Input
                                id="secret_key"
                                type="password"
                                value={settings.captcha.secret_key}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  captcha: { ...settings.captcha, secret_key: e.target.value }
                                })}
                                className="backdrop-blur-sm bg-background/50 border-border/50"
                                placeholder="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email" className="space-y-6">
                  <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        Configurações SMTP
                      </CardTitle>
                      <CardDescription>
                        Configure o servidor de email para notificações
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smtp_enabled">Habilitar SMTP</Label>
                        <Switch
                          id="smtp_enabled"
                          checked={settings.smtp.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            smtp: { ...settings.smtp, enabled: checked }
                          })}
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                        />
                      </div>
                      {settings.smtp.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="smtp_host">Host SMTP</Label>
                            <Input
                              id="smtp_host"
                              value={settings.smtp.host}
                              onChange={(e) => setSettings({
                                ...settings,
                                smtp: { ...settings.smtp, host: e.target.value }
                              })}
                              className="backdrop-blur-sm bg-background/50 border-border/50"
                              placeholder="smtp.gmail.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="smtp_port">Porta</Label>
                            <Input
                              id="smtp_port"
                              type="number"
                              value={settings.smtp.port}
                              onChange={(e) => setSettings({
                                ...settings,
                                smtp: { ...settings.smtp, port: parseInt(e.target.value) }
                              })}
                              className="backdrop-blur-sm bg-background/50 border-border/50"
                              placeholder="587"
                            />
                          </div>
                          <div>
                            <Label htmlFor="smtp_user">Usuário</Label>
                            <Input
                              id="smtp_user"
                              value={settings.smtp.user}
                              onChange={(e) => setSettings({
                                ...settings,
                                smtp: { ...settings.smtp, user: e.target.value }
                              })}
                              className="backdrop-blur-sm bg-background/50 border-border/50"
                              placeholder="seu-email@gmail.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="smtp_pass">Senha</Label>
                            <Input
                              id="smtp_pass"
                              type="password"
                              value={settings.smtp.pass}
                              onChange={(e) => setSettings({
                                ...settings,
                                smtp: { ...settings.smtp, pass: e.target.value }
                              })}
                              className="backdrop-blur-sm bg-background/50 border-border/50"
                              placeholder="sua-senha"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleTestConnection('SMTP')}
                          variant="outline"
                          className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/70"
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Testar Conexão
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Webhooks Tab */}
                <TabsContent value="webhooks" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Slack */}
                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-purple-500" />
                          Slack
                        </CardTitle>
                        <CardDescription>
                          Configure notificações para Slack
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="slack_enabled">Habilitar Slack</Label>
                          <Switch
                            id="slack_enabled"
                            checked={settings.webhooks.slack.enabled}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              webhooks: {
                                ...settings.webhooks,
                                slack: { ...settings.webhooks.slack, enabled: checked }
                              }
                            })}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                          />
                        </div>
                        {settings.webhooks.slack.enabled && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="slack_url">Webhook URL</Label>
                              <Input
                                id="slack_url"
                                value={settings.webhooks.slack.url}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  webhooks: {
                                    ...settings.webhooks,
                                    slack: { ...settings.webhooks.slack, url: e.target.value }
                                  }
                                })}
                                className="backdrop-blur-sm bg-background/50 border-border/50"
                                placeholder="https://hooks.slack.com/services/..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="slack_channel">Canal</Label>
                              <Input
                                id="slack_channel"
                                value={settings.webhooks.slack.channel}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  webhooks: {
                                    ...settings.webhooks,
                                    slack: { ...settings.webhooks.slack, channel: e.target.value }
                                  }
                                })}
                                className="backdrop-blur-sm bg-background/50 border-border/50"
                                placeholder="#notifications"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Telegram */}
                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-blue-500" />
                          Telegram
                        </CardTitle>
                        <CardDescription>
                          Configure notificações para Telegram
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="telegram_enabled">Habilitar Telegram</Label>
                          <Switch
                            id="telegram_enabled"
                            checked={settings.webhooks.telegram.enabled}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              webhooks: {
                                ...settings.webhooks,
                                telegram: { ...settings.webhooks.telegram, enabled: checked }
                              }
                            })}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                          />
                        </div>
                        {settings.webhooks.telegram.enabled && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="telegram_bot_token">Bot Token</Label>
                              <Input
                                id="telegram_bot_token"
                                value={settings.webhooks.telegram.bot_token}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  webhooks: {
                                    ...settings.webhooks,
                                    telegram: { ...settings.webhooks.telegram, bot_token: e.target.value }
                                  }
                                })}
                                className="backdrop-blur-sm bg-background/50 border-border/50"
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                              />
                            </div>
                            <div>
                              <Label htmlFor="telegram_chat_id">Chat ID</Label>
                              <Input
                                id="telegram_chat_id"
                                value={settings.webhooks.telegram.chat_id}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  webhooks: {
                                    ...settings.webhooks,
                                    telegram: { ...settings.webhooks.telegram, chat_id: e.target.value }
                                  }
                                })}
                                className="backdrop-blur-sm bg-background/50 border-border/50"
                                placeholder="-1001234567890"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system" className="space-y-6">
                  <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-orange-500" />
                        Configurações do Sistema
                      </CardTitle>
                      <CardDescription>
                        Configurações gerais da aplicação
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert className="backdrop-blur-sm bg-blue-50/50 border-blue-200/50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          As configurações do sistema são aplicadas globalmente e afetam todos os usuários.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status do Sistema</Label>
                          <Badge className="bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Label>Versão da Aplicação</Label>
                          <Badge variant="outline" className="backdrop-blur-sm bg-background/50 border-border/50">
                            v1.0.0
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}