import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, TestTube, Mail, MessageSquare, Shield, Zap } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      alert('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email');
    }
  };

  const handleTestWebhook = async (type: 'slack' | 'telegram') => {
    try {
      const response = await fetch(`/api/admin/test-webhook/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to send test ${type} webhook`);
      }

      alert(`Test ${type} webhook sent successfully!`);
    } catch (error) {
      console.error(`Error sending test ${type} webhook:`, error);
      alert(`Failed to send test ${type} webhook`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and integrations</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="rate-limiting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rate-limiting">Rate Limiting</TabsTrigger>
          <TabsTrigger value="captcha">CAPTCHA</TabsTrigger>
          <TabsTrigger value="smtp">Email</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Rate Limiting */}
        <TabsContent value="rate-limiting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Rate Limiting</span>
              </CardTitle>
              <CardDescription>
                Configure global rate limiting for API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_attempts">Max Attempts</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="window_minutes">Window (minutes)</Label>
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAPTCHA */}
        <TabsContent value="captcha" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>CAPTCHA Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure reCAPTCHA or hCaptcha for bot protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="captcha_enabled"
                  checked={settings.captcha.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    captcha: {
                      ...settings.captcha,
                      enabled: checked
                    }
                  })}
                />
                <Label htmlFor="captcha_enabled">Enable CAPTCHA</Label>
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
                        captcha: {
                          ...settings.captcha,
                          site_key: e.target.value
                        }
                      })}
                      placeholder="6Lc..."
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
                        captcha: {
                          ...settings.captcha,
                          secret_key: e.target.value
                        }
                      })}
                      placeholder="6Lc..."
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <TestTube className="h-4 w-4 mr-2" />
                    Test CAPTCHA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_enabled"
                  checked={settings.smtp.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    smtp: {
                      ...settings.smtp,
                      enabled: checked
                    }
                  })}
                />
                <Label htmlFor="smtp_enabled">Enable SMTP</Label>
              </div>
              
              {settings.smtp.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        value={settings.smtp.host}
                        onChange={(e) => setSettings({
                          ...settings,
                          smtp: {
                            ...settings.smtp,
                            host: e.target.value
                          }
                        })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_port">Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={settings.smtp.port}
                        onChange={(e) => setSettings({
                          ...settings,
                          smtp: {
                            ...settings.smtp,
                            port: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="smtp_user">Username</Label>
                    <Input
                      id="smtp_user"
                      value={settings.smtp.user}
                      onChange={(e) => setSettings({
                        ...settings,
                        smtp: {
                          ...settings.smtp,
                          user: e.target.value
                        }
                      })}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_pass">Password</Label>
                    <Input
                      id="smtp_pass"
                      type="password"
                      value={settings.smtp.pass}
                      onChange={(e) => setSettings({
                        ...settings,
                        smtp: {
                          ...settings.smtp,
                          pass: e.target.value
                        }
                      })}
                      placeholder="App password"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleTestEmail}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Slack Integration</span>
                </CardTitle>
                <CardDescription>
                  Configure Slack webhook for notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="slack_enabled"
                    checked={settings.webhooks.slack.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      webhooks: {
                        ...settings.webhooks,
                        slack: {
                          ...settings.webhooks.slack,
                          enabled: checked
                        }
                      }
                    })}
                  />
                  <Label htmlFor="slack_enabled">Enable Slack</Label>
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
                            slack: {
                              ...settings.webhooks.slack,
                              url: e.target.value
                            }
                          }
                        })}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="slack_channel">Channel</Label>
                      <Input
                        id="slack_channel"
                        value={settings.webhooks.slack.channel}
                        onChange={(e) => setSettings({
                          ...settings,
                          webhooks: {
                            ...settings.webhooks,
                            slack: {
                              ...settings.webhooks.slack,
                              channel: e.target.value
                            }
                          }
                        })}
                        placeholder="#alerts"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleTestWebhook('slack')}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Slack
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Telegram */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Telegram Integration</span>
                </CardTitle>
                <CardDescription>
                  Configure Telegram bot for notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="telegram_enabled"
                    checked={settings.webhooks.telegram.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      webhooks: {
                        ...settings.webhooks,
                        telegram: {
                          ...settings.webhooks.telegram,
                          enabled: checked
                        }
                      }
                    })}
                  />
                  <Label htmlFor="telegram_enabled">Enable Telegram</Label>
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
                            telegram: {
                              ...settings.webhooks.telegram,
                              bot_token: e.target.value
                            }
                          }
                        })}
                        placeholder="123456789:ABC..."
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
                            telegram: {
                              ...settings.webhooks.telegram,
                              chat_id: e.target.value
                            }
                          }
                        })}
                        placeholder="-1001234567890"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleTestWebhook('telegram')}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Telegram
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
