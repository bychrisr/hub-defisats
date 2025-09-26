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
import SimplePasswordValidator from '@/components/SimplePasswordValidator';
import SimpleEmailValidator from '@/components/SimpleEmailValidator';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { generateTestCredentials } from '@/utils/testDataGenerator';

// Schema with proper validation to match backend requirements
const registerSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  ln_markets_api_key: z.string().min(16, 'API key must be at least 16 characters'),
  ln_markets_api_secret: z.string().min(16, 'API secret must be at least 16 characters'),
  ln_markets_passphrase: z.string().min(8, 'Passphrase must be at least 8 characters'),
  coupon_code: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
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
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    isAvailable: false,
    suggestions: [] as string[]
  });

  // Memoize the email validation callback to prevent hook order issues
  const handleEmailValidationChange = useCallback((isValid: boolean, isAvailable: boolean, suggestions: string[]) => {
    setEmailValidation({ isValid, isAvailable, suggestions });
  }, []);
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

  // Disable browser autofill for username only
  useEffect(() => {
    const disableUsernameAutofill = () => {
      const usernameInput = document.querySelector('input[name="username"]');
      if (usernameInput) {
        usernameInput.setAttribute('autocomplete', 'off');
        usernameInput.setAttribute('data-lpignore', 'true');
        usernameInput.setAttribute('data-form-type', 'other');
      }
    };

    disableUsernameAutofill();
    
    // Re-disable username autofill on focus
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.getAttribute('name') === 'username') {
        disableUsernameAutofill();
      }
    };
    
    document.addEventListener('focusin', handleFocus);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    setValue,
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
    // Debug: Log email validation state
    console.log('📧 Email validation state:', emailValidation);
    
    // Prevent submission if email is not available
    if (!emailValidation.isValid || !emailValidation.isAvailable) {
      console.log('❌ Email validation failed, preventing submission');
      setError('email', { 
        type: 'manual', 
        message: 'Please wait for email validation to complete or use a different email.' 
      });
      return;
    }
    
    console.log('✅ Email validation passed, proceeding with registration');

    // Debug: Validate form data before submission
    console.log('🔍 Form validation check:');
    console.log('  - Email:', data.email, '(valid:', !!data.email, ')');
    console.log('  - Username:', data.username, '(valid:', !!data.username, ')');
    console.log('  - Password:', data.password ? '[REDACTED]' : 'MISSING', '(valid:', !!data.password, ')');
    console.log('  - Confirm Password:', data.confirmPassword ? '[REDACTED]' : 'MISSING', '(valid:', !!data.confirmPassword, ')');
    console.log('  - Passwords match:', data.password === data.confirmPassword);
    console.log('  - API Key:', data.ln_markets_api_key ? '[REDACTED]' : 'MISSING', '(valid:', !!data.ln_markets_api_key, ')');
    console.log('  - API Secret:', data.ln_markets_api_secret ? '[REDACTED]' : 'MISSING', '(valid:', !!data.ln_markets_api_secret, ')');
    console.log('  - Passphrase:', data.ln_markets_passphrase ? '[REDACTED]' : 'MISSING', '(valid:', !!data.ln_markets_passphrase, ')');

    setIsSubmitting(true);
    try {
      clearError();
      
      // 🚨 STEVE'S FIX: Remove undefined fields to prevent Fastify validation errors
      const cleanData: any = {
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword, // ← ADICIONAR confirmPassword
        ln_markets_api_key: data.ln_markets_api_key,
        ln_markets_api_secret: data.ln_markets_api_secret,
        ln_markets_passphrase: data.ln_markets_passphrase,
      };

      // Only add coupon_code if it exists and is not empty
      if (data.coupon_code && data.coupon_code.trim() !== '') {
        cleanData.coupon_code = data.coupon_code;
      }

      // Debug: Log the CLEAN data being sent
      console.log('🚀 CLEAN Registration data being sent:', {
        email: cleanData.email,
        username: cleanData.username,
        password: '***',
        ln_markets_api_key: cleanData.ln_markets_api_key,
        ln_markets_api_secret: cleanData.ln_markets_api_secret,
        ln_markets_passphrase: cleanData.ln_markets_passphrase,
        coupon_code: cleanData.coupon_code || 'NOT_SENT',
      });
      
      await registerUser(cleanData);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error === 'REGISTRATION_FAILED') {
        if (error.response.data.message.includes('already exists')) {
          setError('email', { 
            type: 'manual', 
            message: 'An account with this email already exists. Please use a different email or try logging in.' 
          });
        } else {
          setError('root', { 
            type: 'manual', 
            message: error.response.data.message || 'Registration failed. Please try again.' 
          });
        }
      } else if (error.response?.data?.error === 'VALIDATION_ERROR') {
        setError('root', { 
          type: 'manual', 
          message: error.response.data.message || 'Please check your input and try again.' 
        });
      } else {
        setError('root', { 
          type: 'manual', 
          message: 'Registration failed. Please try again later.' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestData = () => {
    // Always generate completely unique data
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6); // Shorter random string
    
    const testData = {
      email: `test_${timestamp}_${random}@example.com`,
      username: `u${timestamp}${random}`, // Shorter username (max 20 chars)
      ln_markets_api_key: `test_key_${timestamp}_${random}`,
      ln_markets_api_secret: `test_secret_${timestamp}_${random}`,
      ln_markets_passphrase: `testpassphrase_${timestamp}`
    };
    
    console.log('🧪 Generated UNIQUE test data:', testData);
    
    setValue('email', testData.email);
    setValue('username', testData.username);
    setValue('password', 'Test123!@#');
    setValue('confirmPassword', 'Test123!@#');
    setValue('ln_markets_api_key', testData.ln_markets_api_key);
    setValue('ln_markets_api_secret', testData.ln_markets_api_secret);
    setValue('ln_markets_passphrase', testData.ln_markets_passphrase);
    
    console.log('✅ UNIQUE test data filled in form');
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
          <h1 className="text-3xl font-bold text-foreground">Axisor Bot</h1>
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
              autoComplete="off"
              data-lpignore="true"
              style={{ position: 'relative', zIndex: 1 }}
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Hidden field to prevent username autofill confusion */}
              <div style={{ display: 'none' }}>
                <input type="text" name="fake-username" autoComplete="off" />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-text-primary font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  data-testid="email-field"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                  onKeyDown={e => handleKeyDown(e, 'email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {watch('email') && (
                  <SimpleEmailValidator
                    email={watch('email')}
                    onValidationChange={handleEmailValidationChange}
                  />
                )}
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-text-primary font-medium"
                >
                  Username
                </Label>
                <div className="relative" style={{ zIndex: 10 }}>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  data-testid="username-field"
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
                  onKeyDown={e => handleKeyDown(e, 'username')}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
                  {usernameChecking ? (
                    <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-text-secondary" />
                  ) : usernameAvailable === true ? (
                    <CheckCircle className="absolute right-2 top-2 h-4 w-4 text-success" />
                  ) : usernameAvailable === false ? (
                    <XCircle className="absolute right-2 top-2 h-4 w-4 text-destructive" />
                  ) : null}
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
                {!errors.username && username && username.length >= 3 && (
                  <p
                    className={`text-sm ${usernameAvailable === true ? 'text-success' : usernameAvailable === false ? 'text-destructive' : 'text-text-secondary'}`}
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
                  className="text-text-primary font-medium"
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
                  <SimplePasswordValidator password={password} />
                )}
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-text-primary font-medium"
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
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    As senhas não coincidem
                  </p>
                )}
                {errors.confirmPassword && !showPasswordMismatch && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ln_markets_api_key"
                  className="text-text-primary font-medium"
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
                  <p className="text-sm text-destructive">
                    {errors.ln_markets_api_key.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ln_markets_api_secret"
                  className="text-text-primary font-medium"
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
                  <p className="text-sm text-destructive">
                    {errors.ln_markets_api_secret.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ln_markets_passphrase"
                  className="text-text-primary font-medium"
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
                  <p className="text-sm text-destructive">
                    {errors.ln_markets_passphrase.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="coupon_code"
                  className="text-text-primary font-medium"
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
                  <Info className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    Coupon codes can unlock premium features or extend your
                    trial period.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={fillTestData}
                  disabled={isLoading || isSubmitting}
                >
                  Fill with test data (unique email)
                </Button>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isSubmitting || !emailValidation.isValid || !emailValidation.isAvailable}
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
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
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
