import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Info, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  ln_markets_api_key: z.string().min(16, 'API key must be at least 16 characters'),
  ln_markets_api_secret: z.string().min(16, 'API secret must be at least 16 characters'),
  ln_markets_passphrase: z.string().min(8, 'Passphrase must be at least 8 characters'),
  coupon_code: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');
  const username = watch('username');

  // Check username availability with debouncing
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setUsernameChecking(true);
      try {
        const response = await api.get(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        setUsernameAvailable(response.data.available);
      } catch (error: any) {
        console.error('Username check failed:', error);
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500); // 500ms debounce
    return () => clearTimeout(debounceTimer);
  }, [username]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError();
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        ln_markets_api_key: data.ln_markets_api_key,
        ln_markets_api_secret: data.ln_markets_api_secret,
        ln_markets_passphrase: data.ln_markets_passphrase,
        coupon_code: data.coupon_code || undefined,
      });
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    return score;
  };

  const passwordStrength = password ? getPasswordStrength(password) : 0;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Hub-defisats</h1>
          <p className="mt-2 text-sm text-gray-600">
            LN Markets Automation Platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Set up your account to start automating your LN Markets trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    {...register('username')}
                    className={errors.username ? 'border-red-500 pr-8' : usernameAvailable === false ? 'border-red-500 pr-8' : usernameAvailable === true ? 'border-green-500 pr-8' : 'pr-8'}
                  />
                  {usernameChecking ? (
                    <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />
                  ) : usernameAvailable === true ? (
                    <CheckCircle className="absolute right-2 top-2 h-4 w-4 text-green-500" />
                  ) : usernameAvailable === false ? (
                    <XCircle className="absolute right-2 top-2 h-4 w-4 text-red-500" />
                  ) : null}
                </div>
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
                {!errors.username && username && username.length >= 3 && (
                  <p className={`text-sm ${usernameAvailable === true ? 'text-green-600' : usernameAvailable === false ? 'text-red-600' : 'text-gray-600'}`}>
                    {usernameAvailable === true ? '✓ Username disponível' : usernameAvailable === false ? '✗ Username já está em uso' : 'Verificando disponibilidade...'}
                  </p>
                )}
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    Username deve ter 3-20 caracteres, apenas letras, números e underscore (_)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 w-full rounded ${
                            level <= passwordStrength
                              ? strengthColors[passwordStrength - 1]
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Password strength: {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Very Weak'}
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_key">LN Markets API Key</Label>
                <Input
                  id="ln_markets_api_key"
                  type="text"
                  placeholder="Enter your LN Markets API key"
                  {...register('ln_markets_api_key')}
                  className={errors.ln_markets_api_key ? 'border-red-500' : ''}
                />
                {errors.ln_markets_api_key && (
                  <p className="text-sm text-red-500">{errors.ln_markets_api_key.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_secret">LN Markets API Secret</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_api_secret"
                    type={showApiSecret ? 'text' : 'password'}
                    placeholder="Enter your LN Markets API secret"
                    {...register('ln_markets_api_secret')}
                    className={errors.ln_markets_api_secret ? 'border-red-500 pr-10' : 'pr-10'}
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
                  <p className="text-sm text-red-500">{errors.ln_markets_api_secret.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ln_markets_passphrase">LN Markets Passphrase</Label>
                <div className="relative">
                  <Input
                    id="ln_markets_passphrase"
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Enter your LN Markets passphrase"
                    {...register('ln_markets_passphrase')}
                    className={errors.ln_markets_passphrase ? 'border-red-500 pr-10' : 'pr-10'}
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
                  <p className="text-sm text-red-500">{errors.ln_markets_passphrase.message}</p>
                )}
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    Passphrase is required for LN Markets API authentication and is used to generate secure signatures.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon_code">Coupon Code (Optional)</Label>
                <Input
                  id="coupon_code"
                  type="text"
                  placeholder="Enter coupon code if you have one"
                  {...register('coupon_code')}
                />
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    Coupon codes can unlock premium features or extend your trial period.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
