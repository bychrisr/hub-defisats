import { useState, useEffect, useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { useLNMarketsConnectionStatus } from '@/hooks/useLNMarketsConnectionStatus';
import { api } from '@/lib/api';
import ImageUpload from '@/components/ui/ImageUpload';

const profileSchema = z.object({
  // Profile Information
  username: z.string().min(1, 'Username is required').max(20, 'Username must be 20 characters or less'),
  bio: z.string().max(250, 'Bio must be 250 characters or less').optional(),
  
  // API Credentials
  email: z.string().email('Invalid email address'),
  ln_markets_api_key: z
    .string()
    .min(16, 'API key must be at least 16 characters'),
  ln_markets_api_secret: z
    .string()
    .min(16, 'API secret must be at least 16 characters'),
  ln_markets_passphrase: z
    .string()
    .min(8, 'Passphrase must be at least 8 characters'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const [activeSection, setActiveSection] = useState('profile');
  
  // LN Markets connection status
  const { isConnected, isLoading: isCheckingConnection, error: connectionError, hasCredentials } = useLNMarketsConnectionStatus();

  // Função para obter as cores do plano
  const getPlanColors = (planType: string) => {
    switch (planType) {
      case 'lifetime':
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-500/20',
          ring: 'ring-yellow-500/30',
          text: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'pro':
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-500/20',
          ring: 'ring-yellow-500/30',
          text: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'advanced':
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-500/20',
          ring: 'ring-purple-500/30',
          text: 'text-purple-600 dark:text-purple-400'
        };
      case 'basic':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-500/20',
          ring: 'ring-blue-500/30',
          text: 'text-blue-600 dark:text-blue-400'
        };
      case 'free':
      default:
        return {
          border: 'border-green-500',
          bg: 'bg-green-500/20',
          ring: 'ring-green-500/30',
          text: 'text-green-600 dark:text-green-400'
        };
    }
  };

  // Função para obter o ícone do plano
  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'lifetime':
        return <Star className="h-3 w-3" />;
      case 'pro':
        return <Crown className="h-3 w-3" />;
      case 'advanced':
        return <Zap className="h-3 w-3" />;
      case 'basic':
        return <CreditCard className="h-3 w-3" />;
      case 'free':
      default:
        return <Check className="h-3 w-3" />;
    }
  };

  // Função para lidar com upload de imagem
  const handleImageUpload = async (file: File | null) => {
    setProfileImage(file);
    
    if (file) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch('/api/upload/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const result = await response.json();
        console.log('Upload successful:', result);
        
        setSuccess('Foto de perfil atualizada com sucesso!');
        setTimeout(() => setSuccess(null), 5000);
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Erro ao fazer upload da imagem. Tente novamente.');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { user, getProfile, isLoading: authLoading } = useAuthStore();
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const watchedFields = watch();

  // Load fresh profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        console.log('🔄 PROFILE - Loading fresh profile data...');
        await getProfile();
      } catch (error) {
        console.error('❌ PROFILE - Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [getProfile]);

  useEffect(() => {
    if (user) {
      const userData = user as any;
      console.log('🔄 PROFILE - Updating form with user data:', {
        username: userData.username,
        bio: userData.bio,
        hasApiKey: !!user.ln_markets_api_key,
        hasApiSecret: !!user.ln_markets_api_secret,
        hasPassphrase: !!user.ln_markets_passphrase
      });
      
      reset({
        username: userData.username || user.email?.split('@')[0] || '',
        bio: userData.bio || '',
        email: user.email,
        ln_markets_api_key: user.ln_markets_api_key || '',
        ln_markets_api_secret: user.ln_markets_api_secret || '',
        ln_markets_passphrase: user.ln_markets_passphrase || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      console.log('🔍 PROFILE - Updating profile:', {
        email: data.email,
        ln_markets_api_key: data.ln_markets_api_key ? '***' : 'not provided',
        ln_markets_api_secret: data.ln_markets_api_secret ? '***' : 'not provided',
        ln_markets_passphrase: data.ln_markets_passphrase ? '***' : 'not provided',
      });

      const response = await api.put('/api/profile', data);
      const result = response.data;

      if (result.success) {
        console.log('✅ PROFILE - Profile updated successfully');
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Refresh user data
        await getProfile();
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        console.error('❌ PROFILE - Error updating profile:', result.message);
        setError(result.message);
      }
    } catch (error: any) {
      console.error('❌ PROFILE - Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case 'pro':
        return 'default';
      case 'advanced':
        return 'secondary';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const credentialsStatus = useMemo(() => {
    const hasKey = watchedFields.ln_markets_api_key && watchedFields.ln_markets_api_key.length > 0;
    const hasSecret = watchedFields.ln_markets_api_secret && watchedFields.ln_markets_api_secret.length > 0;
    const hasPassphrase = watchedFields.ln_markets_passphrase && watchedFields.ln_markets_passphrase.length > 0;
    
    if (hasKey && hasSecret && hasPassphrase) {
      return { status: 'complete', message: 'All credentials configured' };
    } else if (hasKey || hasSecret || hasPassphrase) {
      return { status: 'partial', message: 'Some credentials missing' };
    } else {
      return { status: 'missing', message: 'No credentials configured' };
    }
  }, [watchedFields.ln_markets_api_key, watchedFields.ln_markets_api_secret, watchedFields.ln_markets_passphrase]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            User not found. Please log in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* About me Section */}
          <Card>
            <CardHeader>
          <CardTitle className="text-xl font-semibold">About me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-6">
              <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={cn(
                  "absolute -inset-1 rounded-full",
                  getPlanColors((user as any)?.plan_type || 'free').bg,
                  getPlanColors((user as any)?.plan_type || 'free').ring
                )}></div>
                <div className={cn(
                  "absolute -inset-0.5 rounded-full",
                  getPlanColors((user as any)?.plan_type || 'free').border,
                  "border-2"
                )}></div>
                <Avatar className="h-20 w-20 relative z-10">
                  <AvatarImage src={profileImage ? URL.createObjectURL(profileImage) : "/avatars/01.png"} />
                  <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Plan Icon Badge */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
                  getPlanColors((user as any)?.plan_type || 'free').bg,
                  getPlanColors((user as any)?.plan_type || 'free').border,
                  "border-2"
                )}>
                  {getPlanIcon((user as any)?.plan_type || 'free')}
                </div>
              </div>
                <div className="space-y-2">
                <h3 className="text-lg font-semibold">Foto de Perfil</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Clique para editar sua foto de perfil
                </p>
              </div>
            </div>
            
            {/* Image Upload Component */}
            <ImageUpload
              onImageChange={handleImageUpload}
              currentImage={profileImage ? URL.createObjectURL(profileImage) : undefined}
              maxSize={5}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              className="max-w-md"
            />
            
            {isUploadingImage && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Fazendo upload da imagem...</span>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              {/* Hidden field to prevent browser autocomplete */}
              <input
                type="text"
                name="fake_username"
                autoComplete="username"
                style={{ display: 'none' }}
                tabIndex={-1}
              />
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  name="user_handle"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  data-lpignore="true"
                  {...register('username')}
                  className={cn(
                    "pr-16",
                    errors.username ? 'border-red-500' : ''
                  )}
                  placeholder="Enter your username"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  {watchedFields.username?.length || 0}/20
                </div>
              </div>
                  <p className="text-xs text-muted-foreground">
                * Username can only be changed once per 7 days
                  </p>
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
                </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <div className="relative">
                <Textarea
                  id="bio"
                  {...register('bio')}
                  className={cn(
                    "pr-16 min-h-[100px]",
                    errors.bio ? 'border-red-500' : ''
                  )}
                  placeholder="A brief introduction about yourself"
                />
                <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                  {watchedFields.bio?.length || 0}/250
                </div>
              </div>
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
              </div>


            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Social Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Social Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Twitter */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black rounded-lg">
                <Twitter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                <p className="font-medium">X (Twitter)</p>
                <p className="text-sm text-muted-foreground">
                  Connect to your Twitter account to complete relevant tasks in Quest
                </p>
                    </div>
                  </div>
            <Button variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600">
              <Link className="mr-2 h-4 w-4" />
              Connect
            </Button>
                </div>

          {/* Telegram */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
                  <div>
                <p className="font-medium">Telegram</p>
                <p className="text-sm text-muted-foreground">
                  Connect to your Telegram account to complete relevant tasks in Quest
                    </p>
                  </div>
            </div>
            <Button variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600">
              <Link className="mr-2 h-4 w-4" />
              Connect
            </Button>
          </div>

          {/* Discord */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Hash className="h-5 w-5 text-white" />
                  </div>
                  <div>
                <p className="font-medium">Discord</p>
                <p className="text-sm text-muted-foreground">
                  Connect to your Discord account to complete relevant tasks in Quest
                    </p>
                  </div>
                </div>
            <Button variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600">
              <Link className="mr-2 h-4 w-4" />
              Connect
            </Button>
              </div>
            </CardContent>
          </Card>

      {/* Community Section */}
          <Card>
            <CardHeader>
          <CardTitle className="text-xl font-semibold">Community</CardTitle>
            </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
                  <div>
              <p className="font-medium">Blocked accounts</p>
              <p className="text-sm text-muted-foreground">
                The people you block won't be able to follow or message you, and you won't see notifications from them.
              </p>
                  </div>
            <Button variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600">
              Manage
            </Button>
                </div>
        </CardContent>
      </Card>

      {/* Account Deletion Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Account Deletion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can request your Hub DeFiSats account to be deleted along with all your associated data. 
              Your request will be processed within 21 days.
            </p>
            <Button variant="outline" size="sm" className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              Request Account Deletion
            </Button>
              </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      {/* LN Markets API Credentials Card */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">LN Markets API Credentials</CardTitle>
                <CardDescription className="text-sm">
                  Configure your API credentials for automated trading
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCheckingConnection ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Checking...
                  </span>
                </>
              ) : isConnected ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {hasCredentials ? 'Invalid Credentials' : 'Not Configured'}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Connection Error Alert */}
          {!isConnected && hasCredentials && connectionError && (
            <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}
          
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Key Card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <Label htmlFor="ln_markets_api_key" className="text-sm font-medium">
                    API Key
                  </Label>
                </div>
                    <div className="relative">
                      <Input
                        id="ln_markets_api_key"
                        type={showApiKey ? 'text' : 'password'}
                        {...register('ln_markets_api_key')}
                    className={cn(
                      "pr-10 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
                      errors.ln_markets_api_key ? 'border-red-500' : ''
                    )}
                    placeholder="Enter your API key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.ln_markets_api_key && (
                  <p className="text-xs text-red-500">{errors.ln_markets_api_key.message}</p>
                    )}
                  </div>

              {/* API Secret Card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <Label htmlFor="ln_markets_api_secret" className="text-sm font-medium">
                    API Secret
                  </Label>
                </div>
                    <div className="relative">
                      <Input
                        id="ln_markets_api_secret"
                        type={showApiSecret ? 'text' : 'password'}
                        {...register('ln_markets_api_secret')}
                    className={cn(
                      "pr-10 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
                      errors.ln_markets_api_secret ? 'border-red-500' : ''
                    )}
                    placeholder="Enter your API secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                      >
                        {showApiSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.ln_markets_api_secret && (
                  <p className="text-xs text-red-500">{errors.ln_markets_api_secret.message}</p>
                    )}
              </div>
                  </div>

            {/* Passphrase Card - Full Width */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                <Label htmlFor="ln_markets_passphrase" className="text-sm font-medium">
                  Passphrase
                </Label>
              </div>
                    <div className="relative">
                      <Input
                        id="ln_markets_passphrase"
                        type={showPassphrase ? 'text' : 'password'}
                        {...register('ln_markets_passphrase')}
                  className={cn(
                    "pr-10 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
                    errors.ln_markets_passphrase ? 'border-red-500' : ''
                  )}
                  placeholder="Enter your passphrase"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                      >
                        {showPassphrase ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.ln_markets_passphrase && (
                <p className="text-xs text-red-500">{errors.ln_markets_passphrase.message}</p>
                    )}
                </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <ShieldIcon className="h-4 w-4" />
                <span>Your credentials are encrypted and stored securely</span>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Credentials
                    </>
                  )}
                </Button>
              </div>
                </div>
              </form>
            </CardContent>
          </Card>

      {/* Future: Account Information Card */}
      <Card className="border-gray-200 dark:border-gray-700 opacity-60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                Account Information
              </CardTitle>
              <CardDescription className="text-sm text-gray-400">
                Coming soon - View your LN Markets account details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Account information will be displayed here
            </p>
            <p className="text-xs text-gray-400">
              Balance, trading history, and account settings
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      {/* Notification Channels Card */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Notification Channels</CardTitle>
              <CardDescription className="text-sm">
                Choose how you want to receive notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Active
                </span>
              </div>
            </div>

            {/* Telegram Bot */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Telegram Bot</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Instant notifications via Telegram
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">WhatsApp</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Notifications via WhatsApp Business
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Browser push notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Active
                </span>
              </div>
            </div>

            {/* Webhook */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Link className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium">Custom Webhook</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Send notifications to your own endpoint
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types Card */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <AlertTriangle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Notification Types</CardTitle>
              <CardDescription className="text-sm">
                Configure what events you want to be notified about
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Margin Alerts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400">Margin Alerts</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Critical alerts when margin ratio reaches dangerous levels
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Always On
                  </span>
                </div>
              </div>
              <div className="pl-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                  <span>Margin ratio &gt; 80% (Warning)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                  <span>Margin ratio &gt; 90% (Critical)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                  <span>Position automatically closed</span>
                </div>
              </div>
            </div>

            {/* Trade Alerts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-600 dark:text-blue-400">Trade Alerts</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Notifications about trading activities and automation status
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Enabled
                  </span>
                </div>
              </div>
              <div className="pl-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span>Position opened/closed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span>Take Profit triggered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span>Stop Loss executed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span>Automation errors</span>
                </div>
              </div>
            </div>

            {/* System Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-600 dark:text-purple-400">System Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Platform updates, maintenance, and account-related notifications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Enabled
                  </span>
                </div>
              </div>
              <div className="pl-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <span>Payment confirmations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <span>Plan upgrades/downgrades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <span>Maintenance windows</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <span>Security alerts</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future: Advanced Settings Card */}
      <Card className="border-gray-200 dark:border-gray-700 opacity-60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Settings className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                Advanced Settings
              </CardTitle>
              <CardDescription className="text-sm text-gray-400">
                Coming soon - Custom notification rules and schedules
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Advanced notification settings will be available here
            </p>
            <p className="text-xs text-gray-400">
              Custom rules, quiet hours, and notification frequency controls
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription className="text-sm">
                Your current subscription and usage
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Plan Info */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">Free Plan</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Perfect for testing and getting started
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Free
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Lifetime access
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                What's included:
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Margin Guard protection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Real-time simulations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Basic automations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Email notifications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Dashboard access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Basic support</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans Card */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Available Plans</CardTitle>
              <CardDescription className="text-sm">
                Upgrade to unlock more features and higher limits
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <div className="text-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Basic</h3>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  10,000 sats
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  per month
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Everything in Free</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Advanced automations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Telegram notifications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Priority support</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                Upgrade to Basic
              </Button>
            </div>

            {/* Advanced Plan */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <div className="text-center mb-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Advanced</h3>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  25,000 sats
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  per month
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Everything in Basic</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Custom strategies</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>WhatsApp notifications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>API access</span>
                </div>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Upgrade to Advanced
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-yellow-300 dark:hover:border-yellow-600 transition-colors">
              <div className="text-center mb-4">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold">Pro</h3>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  50,000 sats
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  per month
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Everything in Advanced</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>White-label options</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Custom webhooks</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Dedicated support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Priority features</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                Upgrade to Pro
              </Button>
            </div>
          </div>

          {/* Lifetime Plan */}
          <div className="mt-6 p-4 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Lifetime Access</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    One-time payment, lifetime access to all features
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  500,000 sats
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  One-time payment
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>All Pro features included</span>
              </div>
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                Get Lifetime Access
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Card */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Payment History</CardTitle>
              <CardDescription className="text-sm">
                Your transaction history and invoices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              No payment history yet
            </p>
            <p className="text-xs text-gray-400">
              Your payment history will appear here once you make your first upgrade
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coupon Code Card */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Hash className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Coupon Code</CardTitle>
              <CardDescription className="text-sm">
                Have a coupon? Enter it here to get discounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter coupon code"
              className="flex-1"
            />
            <Button className="bg-green-600 hover:bg-green-700">
              Apply
            </Button>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Popular codes: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ALPHATESTER</span>, <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">EARLYBIRD</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200 font-medium flex-1">
              {success}
            </AlertDescription>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}

        <div className="flex gap-8">
          {/* Sidebar with Glow Effect */}
          <div className="w-64 flex-shrink-0">
            <nav className={cn(
              "space-y-2 p-4 rounded-lg",
              theme === 'dark' ? 'profile-sidebar-glow' : 'profile-sidebar-glow-light'
            )}>
              <button
                onClick={() => setActiveSection('profile')}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 text-left profile-sidebar-item",
                  activeSection === 'profile'
                    ? "active text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserIcon className="h-5 w-5" />
                <div>
                  <div className="font-medium">Profile</div>
                  <div className="text-xs opacity-75">Personal information and settings</div>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('security')}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 text-left profile-sidebar-item",
                  activeSection === 'security'
                    ? "active text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShieldIcon className="h-5 w-5" />
                <div>
                  <div className="font-medium">Account Security</div>
                  <div className="text-xs opacity-75">API credentials and security settings</div>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('notifications')}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 text-left profile-sidebar-item",
                  activeSection === 'notifications'
                    ? "active text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Bell className="h-5 w-5" />
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-xs opacity-75">Notification preferences</div>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('billing')}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 text-left profile-sidebar-item",
                  activeSection === 'billing'
                    ? "active text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CreditCard className="h-5 w-5" />
                <div>
                  <div className="font-medium">Billing & Plans</div>
                  <div className="text-xs opacity-75">Manage your subscription</div>
                </div>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'profile' && renderProfileSection()}
            {activeSection === 'security' && renderSecuritySection()}
            {activeSection === 'notifications' && renderNotificationsSection()}
            {activeSection === 'billing' && renderBillingSection()}
          </div>
        </div>
      </div>
    </div>
  );
}