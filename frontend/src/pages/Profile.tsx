import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Shield, Key } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

const profileSchema = z.object({
  email: z.string().email('Invalid email address'),
  ln_markets_api_key: z.string().min(16, 'API key must be at least 16 characters'),
  ln_markets_api_secret: z.string().min(16, 'API secret must be at least 16 characters'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user, getProfile, isLoading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        ln_markets_api_key: '••••••••••••••••', // Masked for display
        ln_markets_api_secret: '••••••••••••••••', // Masked for display
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      // TODO: Implement profile update API
      console.log('Profile update:', data);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
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

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'pro':
        return 'text-purple-600';
      case 'advanced':
        return 'text-blue-600';
      case 'basic':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
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
          <XCircle className="h-4 w-4" />
          <AlertDescription>User not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
          <Badge variant={getPlanBadgeVariant(user.plan_type)} className="text-sm">
            {user.plan_type.toUpperCase()} Plan
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your basic account details and plan information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan Type</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={user.plan_type} disabled />
                      <Badge variant={getPlanBadgeVariant(user.plan_type)}>
                        {user.plan_type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={user.is_active ? 'Active' : 'Inactive'} disabled />
                      {user.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Verified</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={user.email_verified ? 'Verified' : 'Not Verified'} disabled />
                      {user.email_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <Input value={new Date(user.created_at).toLocaleDateString()} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <Input value={new Date(user.updated_at).toLocaleDateString()} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.two_factor_enabled ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-600">Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="text-sm text-red-600">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Key className="h-5 w-5 text-green-500" />
                      <div>
                        <h3 className="font-medium">Password</h3>
                        <p className="text-sm text-gray-600">
                          Last changed: Never (set during registration)
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>LN Markets API Configuration</CardTitle>
                <CardDescription>
                  Manage your LN Markets API keys for trading automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ln_markets_api_key">API Key</Label>
                    <Input
                      id="ln_markets_api_key"
                      type="text"
                      placeholder="Enter your LN Markets API key"
                      {...register('ln_markets_api_key')}
                      className={errors.ln_markets_api_key ? 'border-red-500' : ''}
                      disabled={!isEditing}
                    />
                    {errors.ln_markets_api_key && (
                      <p className="text-sm text-red-500">{errors.ln_markets_api_key.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ln_markets_api_secret">API Secret</Label>
                    <div className="relative">
                      <Input
                        id="ln_markets_api_secret"
                        type={showApiSecret ? 'text' : 'password'}
                        placeholder="Enter your LN Markets API secret"
                        {...register('ln_markets_api_secret')}
                        className={errors.ln_markets_api_secret ? 'border-red-500 pr-10' : 'pr-10'}
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
                      <p className="text-sm text-red-500">{errors.ln_markets_api_secret.message}</p>
                    )}
                  </div>

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
                          onClick={() => {
                            setIsEditing(false);
                            reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        Edit API Keys
                      </Button>
                    )}
                  </div>
                </form>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Security Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your API keys are encrypted and stored securely. Never share your API secret with anyone.
                        If you suspect your keys have been compromised, regenerate them in your LN Markets account.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
