import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

const profileSchema = z.object({
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
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user, getProfile, isLoading: authLoading } = useAuthStore();

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile, LN Markets credentials, and account settings
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-success/20 bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="credentials">LN Markets</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account information and plan details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/avatars/01.png" />
                  <AvatarFallback className="text-lg">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" disabled>
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG up to 2MB
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-lg font-semibold">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                    <div className="mt-1">
                      <Badge variant={getPlanBadgeVariant(user?.plan_type || 'free')}>
                        {user?.plan_type?.toUpperCase() || 'FREE'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <p className="text-lg font-semibold">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Activity</Label>
                    <p className="text-lg font-semibold">
                      {user?.last_activity_at ? new Date(user.last_activity_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                LN Markets Credentials
              </CardTitle>
              <CardDescription>
                Configure your LN Markets API credentials for trading integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Credentials Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {credentialsStatus.status === 'complete' ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : credentialsStatus.status === 'partial' ? (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">Credentials Status</p>
                    <p className="text-sm text-muted-foreground">{credentialsStatus.message}</p>
                  </div>
                </div>
                <Badge 
                  variant={
                    credentialsStatus.status === 'complete' ? 'default' : 
                    credentialsStatus.status === 'partial' ? 'secondary' : 
                    'destructive'
                  }
                >
                  {credentialsStatus.status.toUpperCase()}
                </Badge>
              </div>

              <Separator />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ln_markets_api_key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="ln_markets_api_key"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Enter your LN Markets API key"
                        autoComplete="off"
                        {...register('ln_markets_api_key')}
                        className={
                          errors.ln_markets_api_key
                            ? 'border-red-500 pr-10'
                            : 'pr-10'
                        }
                        disabled={!isEditing}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                        disabled={!isEditing}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.ln_markets_api_key && (
                      <p className="text-sm text-destructive">
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
                        placeholder="Enter your LN Markets API secret"
                        autoComplete="off"
                        {...register('ln_markets_api_secret')}
                        className={
                          errors.ln_markets_api_secret
                            ? 'border-red-500 pr-10'
                            : 'pr-10'
                        }
                        disabled={!isEditing}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                        disabled={!isEditing}
                      >
                        {showApiSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.ln_markets_api_secret && (
                      <p className="text-sm text-destructive">
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
                        placeholder="Enter your LN Markets passphrase"
                        autoComplete="off"
                        {...register('ln_markets_passphrase')}
                        className={
                          errors.ln_markets_passphrase
                            ? 'border-red-500 pr-10'
                            : 'pr-10'
                        }
                        disabled={!isEditing}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        disabled={!isEditing}
                      >
                        {showPassphrase ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.ln_markets_passphrase && (
                      <p className="text-sm text-destructive">
                        {errors.ln_markets_passphrase.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsEditing(false);
                          reset();
                          setError(null);
                          setSuccess(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        setIsEditing(true);
                      }}
                    >
                      Edit Credentials
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}