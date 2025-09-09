import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  XCircle,
  Moon,
  Sun,
} from 'lucide-react';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import PasswordValidator from '@/components/PasswordValidator';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';

// Simplified schema - validation now handled by backend
const registerSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  ln_markets_api_key: z.string().min(1, 'API key is required'),
  ln_markets_api_secret: z.string().min(1, 'API secret is required'),
  ln_markets_passphrase: z.string().min(1, 'Passphrase is required'),
  coupon_code: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);
  const { usernameAvailable, usernameChecking, checkUsername } =
    useUsernameValidation();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a preference stored
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const {
    register: registerUser,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordMismatch, setShowPasswordMismatch] = useState(false);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const username = watch('username');

  // Check username availability with debouncing
  useEffect(() => {
    if (!username || username.length < 3) {
      return;
    }

    // Basic format validation first
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return;
    }

    const debounceTimer = setTimeout(() => {
      checkUsername(username);
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [username, checkUsername]);

  // Check password match in real-time
  useEffect(() => {
    if (confirmPassword && password) {
      setShowPasswordMismatch(password !== confirmPassword);
    } else {
      setShowPasswordMismatch(false);
    }
  }, [password, confirmPassword]);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, fieldName: string) => {
      if (e.key === 'Tab') {
        setFocusedField(fieldName);
      }
    },
    []
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        action();
      }
    },
    []
  );

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password validation now handled by PasswordValidator component

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Theme Toggle */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 p-0"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Hub-defisats</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              role="form"
              aria-label="User registration form"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                  onKeyDown={e => handleKeyDown(e, 'email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    autoComplete="off"
                    {...register('username')}
                    className={
                      errors.username
                        ? 'border-red-500 pr-8'
                        : usernameAvailable === false
                          ? 'border-red-500 pr-8'
                          : usernameAvailable === true
                            ? 'border-green-500 pr-8'
                            : 'pr-8'
                    }
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
                  <p className="text-sm text-red-500">
                    {errors.username.message}
                  </p>
                )}
                {!errors.username && username && username.length >= 3 && (
                  <p
                    className={`text-sm ${usernameAvailable === true ? 'text-green-600' : usernameAvailable === false ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {usernameAvailable === true
                      ? '✓ Username disponível'
                      : usernameAvailable === false
                        ? '✗ Username já está em uso'
                        : 'Verificando disponibilidade...'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={
                      errors.password ? 'border-red-500 pr-10' : 'pr-10'
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    onKeyDown={e => handleKeyPress(e, togglePasswordVisibility)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-expanded={showPassword}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {password && (
                <PasswordValidator
                  password={password}
                  showStrength={true}
                  onValidationChange={(isValid, suggestions) => {
                    // You can use this callback to update form state if needed
                    console.log('Password validation:', { isValid, suggestions });
                  }}
                />
                )}
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={`pr-10 ${errors.confirmPassword || showPasswordMismatch ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={toggleConfirmPasswordVisibility}
                    onKeyDown={e =>
                      handleKeyPress(e, toggleConfirmPasswordVisibility)
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    aria-expanded={showConfirmPassword}
                    tabIndex={0}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {showPasswordMismatch && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    As senhas não coincidem
                  </p>
                )}
                {errors.confirmPassword && !showPasswordMismatch && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ln_markets_api_key"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  LN Markets API Key
                </Label>
                <Input
                  id="ln_markets_api_key"
                  type="text"
                  placeholder="Cole sua API Key aqui"
                  autoComplete="off"
                  {...register('ln_markets_api_key')}
                  className={errors.ln_markets_api_key ? 'border-red-500' : ''}
                />
                {errors.ln_markets_api_key && (
                  <p className="text-sm text-red-500">
                    {errors.ln_markets_api_key.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ln_markets_api_secret"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  LN Markets API Secret
                </Label>
                <Input
                  id="ln_markets_api_secret"
                  type="text"
                  placeholder="Cole sua API Secret aqui"
                  autoComplete="off"
                  {...register('ln_markets_api_secret')}
                  className={
                    errors.ln_markets_api_secret ? 'border-red-500' : ''
                  }
                />
                {errors.ln_markets_api_secret && (
                  <p className="text-sm text-red-500">
                    {errors.ln_markets_api_secret.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ln_markets_passphrase"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  LN Markets Passphrase
                </Label>
                <Input
                  id="ln_markets_passphrase"
                  type="text"
                  placeholder="Cole sua passphrase aqui"
                  autoComplete="off"
                  {...register('ln_markets_passphrase')}
                  className={
                    errors.ln_markets_passphrase ? 'border-red-500' : ''
                  }
                />
                {errors.ln_markets_passphrase && (
                  <p className="text-sm text-red-500">
                    {errors.ln_markets_passphrase.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="coupon_code"
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  Coupon Code (Optional)
                </Label>
                <Input
                  id="coupon_code"
                  type="text"
                  placeholder="Enter coupon code if you have one"
                  {...register('coupon_code')}
                />
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    Coupon codes can unlock premium features or extend your
                    trial period.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSubmitting}
                aria-describedby={
                  Object.keys(errors).length > 0 ? 'form-errors' : undefined
                }
                onKeyDown={e => handleKeyDown(e, 'submit')}
                onFocus={() => setFocusedField('submit')}
                onBlur={() => setFocusedField(null)}
              >
                {isLoading || isSubmitting ? (
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
                  className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  onKeyDown={e => handleKeyDown(e, 'login-link')}
                  onFocus={() => setFocusedField('login-link')}
                  onBlur={() => setFocusedField(null)}
                  tabIndex={0}
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
