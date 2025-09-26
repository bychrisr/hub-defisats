import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  RefreshCw, 
  Save, 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Settings
} from 'lucide-react';
import { api } from '@/lib/api';

interface RateLimitConfig {
  id: string;
  environment: 'development' | 'staging' | 'production' | 'global';
  endpointType: 'auth' | 'api' | 'trading' | 'notifications' | 'payments' | 'admin' | 'global';
  maxRequests: number;
  windowMs: number;
  windowMinutes: number;
  message: string;
  skipSuccessfulRequests: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  metadata?: any;
}

interface RateLimitStats {
  total: number;
  byEnvironment: Record<string, number>;
  byEndpointType: Record<string, number>;
  active: number;
  inactive: number;
}

const ENDPOINT_TYPES = [
  { value: 'auth', label: 'Authentication', description: 'Login, register, password reset' },
  { value: 'api', label: 'General API', description: 'General API endpoints' },
  { value: 'trading', label: 'Trading', description: 'Trading operations' },
  { value: 'notifications', label: 'Notifications', description: 'Push notifications' },
  { value: 'payments', label: 'Payments', description: 'Payment processing' },
  { value: 'admin', label: 'Admin', description: 'Admin operations' },
  { value: 'global', label: 'Global', description: 'Global rate limiting' }
];

const ENVIRONMENTS = [
  { value: 'development', label: 'Development', color: 'bg-blue-500' },
  { value: 'staging', label: 'Staging', color: 'bg-yellow-500' },
  { value: 'production', label: 'Production', color: 'bg-green-500' },
  { value: 'global', label: 'Global', color: 'bg-purple-500' }
];

export default function RateLimiting() {
  const [configs, setConfigs] = useState<RateLimitConfig[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('development');
  const [editingConfig, setEditingConfig] = useState<RateLimitConfig | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    environment: 'development',
    endpointType: 'api',
    maxRequests: 100,
    windowMs: 60000,
    message: 'Too many requests, please try again later',
    skipSuccessfulRequests: false,
    isActive: true
  });

  useEffect(() => {
    loadConfigs();
    loadStats();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading rate limit configurations...');
      
      // Verificar token
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      
      // Teste direto com fetch para comparar
      console.log('🧪 Testing with direct fetch...');
      const fetchResponse = await fetch('/api/admin/rate-limit-config/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const fetchData = await fetchResponse.json();
      console.log('🧪 Fetch response:', fetchData);
      
      // Teste com axios
      console.log('🧪 Testing with axios...');
      const response = await api.get('/admin/rate-limit-config/');
      console.log('📊 Axios Response:', response.data);
      
      if (response.data.success) {
        setConfigs(response.data.data);
        console.log('✅ Configurations loaded:', response.data.data.length);
      } else {
        console.log('❌ API returned success: false');
        setError('API returned success: false');
      }
    } catch (err: any) {
      console.error('❌ Error loading configurations:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load rate limit configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/rate-limit-config/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving configuration...', formData);
      if (editingConfig) {
        // Update existing config
        console.log('📝 Updating existing config:', editingConfig.id);
        await api.post('/admin/rate-limit-config/', {
          ...formData,
          id: editingConfig.id
        });
      } else {
        // Create new config
        console.log('➕ Creating new config');
        await api.post('/admin/rate-limit-config/', formData);
      }
      
      console.log('✅ Configuration saved, reloading...');
      await loadConfigs();
      setEditingConfig(null);
      setShowCreateForm(false);
      resetForm();
    } catch (err: any) {
      console.error('❌ Error saving configuration:', err);
      setError(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/rate-limit-config/${id}/toggle`, { isActive });
      await loadConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle configuration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      await api.delete(`/admin/rate-limit-config/${id}`);
      await loadConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      environment: 'development',
      endpointType: 'api',
      maxRequests: 100,
      windowMs: 60000,
      message: 'Too many requests, please try again later',
      skipSuccessfulRequests: false,
      isActive: true
    });
  };

  const openEditForm = (config: RateLimitConfig) => {
    setFormData({
      environment: config.environment,
      endpointType: config.endpointType,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      message: config.message,
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      isActive: config.isActive
    });
    setEditingConfig(config);
    setShowCreateForm(true);
  };

  const filteredConfigs = configs.filter(config => 
    selectedEnvironment === 'all' || config.environment === selectedEnvironment
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Rate Limiting Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure rate limiting rules for different environments and endpoints
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadConfigs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => {
            console.log('➕ New Configuration button clicked');
            setShowCreateForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Configuration
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Configs</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Environments</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byEnvironment).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            variant={showCreateForm ? "outline" : "default"}
            onClick={() => setShowCreateForm(false)}
          >
            Configurations
          </Button>
          <Button 
            variant={showCreateForm ? "default" : "outline"}
            onClick={() => {
              console.log('➕ Create/Edit tab clicked');
              setShowCreateForm(true);
            }}
          >
            Create/Edit
          </Button>
        </div>

        {!showCreateForm && (
          <div className="space-y-4">
          {/* Environment Filter */}
          <div className="flex items-center gap-4">
            <Label>Filter by Environment:</Label>
            <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                {ENVIRONMENTS.map(env => (
                  <SelectItem key={env.value} value={env.value}>
                    {env.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configurations List */}
          <div className="grid gap-4">
            {filteredConfigs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={config.isActive ? 'default' : 'secondary'}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge className={ENVIRONMENTS.find(e => e.value === config.environment)?.color}>
                        {config.environment}
                      </Badge>
                      <Badge variant="outline">{config.endpointType}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(config)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(config.id, !config.isActive)}
                      >
                        {config.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Max Requests</Label>
                      <p className="text-2xl font-bold">{config.maxRequests}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Window</Label>
                      <p className="text-lg">{config.windowMinutes} min</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Skip Success</Label>
                      <p className="text-lg">{config.skipSuccessfulRequests ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Updated</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(config.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {config.message && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Message</Label>
                      <p className="text-sm text-muted-foreground">{config.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
        )}

        {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
                </CardTitle>
                <CardDescription>
                  Configure rate limiting rules for specific environments and endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value) => setFormData({ ...formData, environment: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENVIRONMENTS.map(env => (
                          <SelectItem key={env.value} value={env.value}>
                            {env.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endpointType">Endpoint Type</Label>
                    <Select
                      value={formData.endpointType}
                      onValueChange={(value) => setFormData({ ...formData, endpointType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENDPOINT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRequests">Max Requests</Label>
                    <Input
                      id="maxRequests"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.maxRequests}
                      onChange={(e) => setFormData({ ...formData, maxRequests: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="windowMs">Window (minutes)</Label>
                    <Input
                      id="windowMs"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.windowMs / 60000}
                      onChange={(e) => setFormData({ ...formData, windowMs: parseInt(e.target.value) * 60000 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Rate Limit Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Message shown when rate limit is exceeded"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="skipSuccessfulRequests"
                    checked={formData.skipSuccessfulRequests}
                    onCheckedChange={(checked) => setFormData({ ...formData, skipSuccessfulRequests: checked })}
                  />
                  <Label htmlFor="skipSuccessfulRequests">Skip counting successful requests</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingConfig ? 'Update' : 'Create'} Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingConfig(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
