import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Shield,
  Key,
  User,
  Upload,
  AlertTriangle,
  User as UserIcon,
  Shield as ShieldIcon,
  Bell,
  Link,
  Edit,
  Save,
  X,
  Twitter,
  MessageCircle,
  Mail,
  Settings,
  Hash,
  CreditCard,
  Zap,
  Crown,
  Star,
  Check,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

// ✅ SCHEMA DE VALIDAÇÃO SIMPLIFICADO
const ProfileFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  email: z.string().email('Invalid email address'),
  ln_markets_api_key: z.string().optional(),
  ln_markets_api_secret: z.string().optional(),
  ln_markets_passphrase: z.string().optional(),
});

type ProfileForm = z.infer<typeof ProfileFormSchema>;

/**
 * ✅ PROFILE RESTORED - Design Original com Backend Corrigido
 * 
 * Esta versão mantém o design original com abas, mas aplica todas
 * as correções do backend para evitar loops infinitos.
 */
export default function ProfileRestored() {
  // ✅ ESTADO LOCAL SIMPLIFICADO
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState({
    api_key: false,
    api_secret: false,
    passphrase: false,
  });
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications'>('profile');

  // ✅ HOOKS OTIMIZADOS
  const { user, getProfile } = useAuthStore();
  const { theme } = useTheme();

  // ✅ FORM COM VALIDAÇÃO
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      username: '',
      bio: '',
      email: '',
      ln_markets_api_key: '',
      ln_markets_api_secret: '',
      ln_markets_passphrase: '',
    },
  });

  // ✅ CARREGAMENTO INICIAL - APENAS UMA VEZ (CORREÇÃO DO LOOP)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('🔄 PROFILE RESTORED - Loading profile...');
        await getProfile();
      } catch (error) {
        console.error('❌ PROFILE RESTORED - Error loading profile:', error);
      }
    };

    loadProfile();
  }, []); // ✅ Array vazio - executa apenas uma vez

  // ✅ ATUALIZAÇÃO DO FORM - APENAS QUANDO USER MUDA (CORREÇÃO DO LOOP)
  useEffect(() => {
    if (user) {
      console.log('🔄 PROFILE RESTORED - Updating form with user data');
      reset({
        username: user.username || user.email?.split('@')[0] || '',
        bio: user.bio || '',
        email: user.email || '',
        ln_markets_api_key: user.ln_markets_api_key || '',
        ln_markets_api_secret: user.ln_markets_api_secret || '',
        ln_markets_passphrase: user.ln_markets_passphrase || '',
      });
    }
  }, [user]); // ✅ CORREÇÃO: Removido reset das dependências para evitar loop

  // ✅ FUNÇÕES OTIMIZADAS COM useCallback
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form to original values
    if (user) {
      reset({
        username: user.username || user.email?.split('@')[0] || '',
        bio: user.bio || '',
        email: user.email || '',
        ln_markets_api_key: user.ln_markets_api_key || '',
        ln_markets_api_secret: user.ln_markets_api_secret || '',
        ln_markets_passphrase: user.ln_markets_passphrase || '',
      });
    }
  }, [user, reset]);

  const onSubmit = useCallback(async (data: ProfileForm) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      console.log('🔄 PROFILE RESTORED - Updating profile...');

      const response = await api.put('/api/profile', data);
      const result = response.data;

      if (result.success) {
        console.log('✅ PROFILE RESTORED - Profile updated successfully');
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        
        // Refresh user data
        await getProfile();
        
        // Auto-dismiss success message
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        console.error('❌ PROFILE RESTORED - Error updating profile:', result.message);
        setError(result.message);
      }
    } catch (error: any) {
      console.error('❌ PROFILE RESTORED - Error updating profile:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, [getProfile]);

  const toggleApiKeyVisibility = useCallback((key: keyof typeof showApiKeys) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // ✅ FUNÇÕES AUXILIARES
  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case 'pro': return 'default';
      case 'advanced': return 'secondary';
      case 'basic': return 'outline';
      default: return 'outline';
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'pro': return <Crown className="h-4 w-4" />;
      case 'advanced': return <Star className="h-4 w-4" />;
      case 'basic': return <Check className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  // ✅ RENDERIZAÇÃO CONDICIONAL
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ✅ SEÇÃO DE PERFIL (ABA PRINCIPAL)
  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* ✅ HEADER DO PERFIL */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profile_image_url} alt={user.username} />
            <AvatarFallback className="text-2xl">
              {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user.username || user.email?.split('@')[0]}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant={getPlanBadgeVariant(user.plan_type)} className="flex items-center space-x-1">
                {getPlanIcon(user.plan_type)}
                <span className="capitalize">{user.plan_type}</span>
              </Badge>
              {user.is_admin && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Admin</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FORMULÁRIO DE PERFIL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ✅ INFORMAÇÕES BÁSICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...register('username')}
                  disabled={!isEditing}
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  {...register('email')}
                  disabled={!isEditing}
                  type="email"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows={3}
              />
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
            </div>

            {/* ✅ BOTÕES DE AÇÃO */}
            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !isDirty}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* ✅ INFORMAÇÕES ADICIONAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldIcon className="h-5 w-5" />
              <span>Account Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Verified</span>
              <Badge variant={user.email_verified ? 'default' : 'destructive'}>
                {user.email_verified ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {user.email_verified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">2FA Enabled</span>
              <Badge variant={user.two_factor_enabled ? 'default' : 'outline'}>
                {user.two_factor_enabled ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Member Since</span>
              <span className="text-sm font-medium">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Activity</span>
              <span className="text-sm font-medium">
                {user.last_activity_at 
                  ? new Date(user.last_activity_at).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ✅ SEÇÃO DE SEGURANÇA (ABA SECURITY)
  const renderSecuritySection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>LN Markets API Credentials</span>
          </CardTitle>
          <CardDescription>
            Configure your API credentials for automated trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_api_key"
                    {...register('ln_markets_api_key')}
                    disabled={!isEditing}
                    type={showApiKeys.api_key ? 'text' : 'password'}
                    placeholder="Enter your LN Markets API key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => toggleApiKeyVisibility('api_key')}
                  >
                    {showApiKeys.api_key ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_secret">API Secret</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_api_secret"
                    {...register('ln_markets_api_secret')}
                    disabled={!isEditing}
                    type={showApiKeys.api_secret ? 'text' : 'password'}
                    placeholder="Enter your LN Markets API secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => toggleApiKeyVisibility('api_secret')}
                  >
                    {showApiKeys.api_secret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ln_markets_passphrase">Passphrase</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_passphrase"
                    {...register('ln_markets_passphrase')}
                    disabled={!isEditing}
                    type={showApiKeys.passphrase ? 'text' : 'password'}
                    placeholder="Enter your LN Markets passphrase"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => toggleApiKeyVisibility('passphrase')}
                  >
                    {showApiKeys.passphrase ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* ✅ BOTÕES DE AÇÃO */}
            {!isEditing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Credentials
                </Button>
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !isDirty}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // ✅ SEÇÃO DE NOTIFICAÇÕES (ABA NOTIFICATIONS)
  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ✅ EMAIL NOTIFICATIONS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <h4 className="font-medium">Email Notifications</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trading Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your trading activities
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Security Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* ✅ SYSTEM NOTIFICATIONS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <h4 className="font-medium">System Notifications</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Platform Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications about new features and updates
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Scheduled maintenance notifications
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ✅ ALERTAS */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* ✅ NAVEGAÇÃO POR ABAS */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeSection === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('profile')}
            className="flex items-center space-x-2"
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </Button>
          <Button
            variant={activeSection === 'security' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('security')}
            className="flex items-center space-x-2"
          >
            <ShieldIcon className="h-4 w-4" />
            <span>Security</span>
          </Button>
          <Button
            variant={activeSection === 'notifications' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('notifications')}
            className="flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </Button>
        </div>
      </div>

      {/* ✅ CONTEÚDO DAS ABAS */}
      <div className="space-y-6">
        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'security' && renderSecuritySection()}
        {activeSection === 'notifications' && renderNotificationsSection()}
      </div>
    </div>
  );
}
