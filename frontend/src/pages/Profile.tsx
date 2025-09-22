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
  Calendar,
  Globe,
  Link,
  Edit,
  Save,
  X,
  Twitter,
  MessageCircle,
  Hash,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const profileSchema = z.object({
  // Profile Information
  display_name: z.string().min(1, 'Display name is required').max(20, 'Display name must be 20 characters or less'),
  username: z.string().min(1, 'Username is required').max(20, 'Username must be 20 characters or less'),
  bio: z.string().max(250, 'Bio must be 250 characters or less').optional(),
  birthday: z.string().optional(),
  website: z.string().max(100, 'Website must be 100 characters or less').optional(),
  
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
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  useEffect(() => {
    if (user) {
      reset({
        display_name: user.display_name || user.email?.split('@')[0] || '',
        username: user.username || user.email?.split('@')[0] || '',
        bio: user.bio || '',
        birthday: user.birthday || '',
        website: user.website || '',
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

  const sidebarItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      description: 'Personal information and settings'
    },
    {
      id: 'security',
      label: 'Account Security',
      icon: ShieldIcon,
      description: 'API credentials and security settings'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Notification preferences'
    }
  ];

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* About me Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">About me</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/avatars/01.png" />
              <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <p className="text-sm text-muted-foreground cursor-pointer hover:text-blue-500">
                Get Avatar Frame &gt;
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display name</Label>
              <div className="relative">
                <Input
                  id="display_name"
                  {...register('display_name')}
                  className={cn(
                    "pr-16",
                    errors.display_name ? 'border-red-500' : ''
                  )}
                  placeholder="Enter your display name"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  {watchedFields.display_name?.length || 0}/20
                </div>
              </div>
              {errors.display_name && (
                <p className="text-sm text-red-500">{errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
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

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <div className="relative">
                <Input
                  id="birthday"
                  type="date"
                  {...register('birthday')}
                  className={errors.birthday ? 'border-red-500' : ''}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.birthday && (
                <p className="text-sm text-red-500">{errors.birthday.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Input
                  id="website"
                  {...register('website')}
                  className={cn(
                    "pr-16",
                    errors.website ? 'border-red-500' : ''
                  )}
                  placeholder="Add your website"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  {watchedFields.website?.length || 0}/100
                </div>
              </div>
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            LN Markets API Credentials
          </CardTitle>
          <CardDescription>
            Configure your LN Markets API credentials for trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_api_key"
                    type={showApiKey ? 'text' : 'password'}
                    {...register('ln_markets_api_key')}
                    className={errors.ln_markets_api_key ? 'border-red-500' : ''}
                    placeholder="Enter your LN Markets API key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                  <p className="text-sm text-red-500">
                    {errors.ln_markets_api_key.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_secret">API Secret</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_api_secret"
                    type={showApiSecret ? 'text' : 'password'}
                    {...register('ln_markets_api_secret')}
                    className={errors.ln_markets_api_secret ? 'border-red-500' : ''}
                    placeholder="Enter your LN Markets API secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                  <p className="text-sm text-red-500">
                    {errors.ln_markets_api_secret.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ln_markets_passphrase">Passphrase</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_passphrase"
                    type={showPassphrase ? 'text' : 'password'}
                    {...register('ln_markets_passphrase')}
                    className={errors.ln_markets_passphrase ? 'border-red-500' : ''}
                    placeholder="Enter your LN Markets passphrase"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                  <p className="text-sm text-red-500">
                    {errors.ln_markets_passphrase.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Credentials
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how you want to be notified about important events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Notification settings will be implemented in a future update.
            </p>
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
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                      activeSection === item.id
                        ? "bg-blue-600 text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'profile' && renderProfileSection()}
            {activeSection === 'security' && renderSecuritySection()}
            {activeSection === 'notifications' && renderNotificationsSection()}
          </div>
        </div>
      </div>
    </div>
  );
}