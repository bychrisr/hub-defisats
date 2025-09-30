import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Github, Info } from 'lucide-react';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { useRegistration } from '@/hooks/useRegistration';
import SimpleEmailValidator from '@/components/SimpleEmailValidator';
import SimplePasswordValidator from '@/components/SimplePasswordValidator';

// Schema for the first step: personal data
const personalDataSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers and underscore'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least: 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  coupon_code: z.string().optional(),
  emailMarketingConsent: z.boolean().optional().default(false),
  termsConsent: z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions to continue'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PersonalDataForm = z.infer<typeof personalDataSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    isAvailable: false,
    suggestions: [] as string[]
  });

  const { usernameAvailable, usernameChecking, checkUsername } = useUsernameValidation();
  const { savePersonalData, isLoading, error, clearError } = useRegistration();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize the email validation callback
  const handleEmailValidationChange = useCallback((isValid: boolean, isAvailable: boolean, suggestions: string[]) => {
    setEmailValidation({ isValid, isAvailable, suggestions });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    setValue,
  } = useForm<PersonalDataForm>({
    resolver: zodResolver(personalDataSchema),
  });

  const password = watch('password');
  const username = watch('username');

  // Check username availability with debouncing
  useEffect(() => {
    console.log('🔄 REGISTER - useEffect triggered for username:', username);
    
    if (!username || username.length < 3) {
      console.log('🔄 REGISTER - Username too short, not checking');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      console.log('🔄 REGISTER - Username format invalid, not checking');
      return;
    }

    console.log('🔄 REGISTER - Username valid, setting debounce timer');
    const debounceTimer = setTimeout(() => {
      console.log('🔄 REGISTER - Debounce timer fired, calling checkUsername');
      checkUsername(username);
    }, 500);

    return () => {
      console.log('🔄 REGISTER - Cleaning up debounce timer');
      clearTimeout(debounceTimer);
    };
  }, [username, checkUsername]);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, fieldName: string) => {
      if (e.key === 'Tab') {
        setFocusedField(fieldName);
      }
    },
    []
  );

  const onSubmit = async (data: PersonalDataForm) => {
    // Prevent submission if email is not available
    if (!emailValidation.isValid || !emailValidation.isAvailable) {
      setError('email', { 
        type: 'manual', 
        message: 'Please wait for email validation to complete or use a different email.' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      clearError();
      
      // Preparar dados para o primeiro passo
      const personalData = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        couponCode: data.coupon_code || undefined,
        emailMarketingConsent: data.emailMarketingConsent,
        termsConsent: data.termsConsent,
      };

      console.log('🚀 Personal data being sent:', {
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        username: personalData.username,
        email: personalData.email,
        password: '***',
        couponCode: personalData.couponCode || 'NOT_SENT',
      });
      
      // Chamar a função de registro do hook
      await savePersonalData(personalData);
    } catch (error: any) {
      console.error('Registration error:', error);
          setError('root', { 
            type: 'manual', 
        message: 'Registration failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        </div>

        {/* Main Registration Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-200 text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    {...register('firstName')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                      errors.firstName ? 'border-red-500' : ''
                    }`}
                    onKeyDown={e => handleKeyDown(e, 'firstName')}
                  />
                  {errors.firstName && (
                    <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span className="font-medium">First name required</span>
                      </div>
                      <p className="mt-1 text-red-300 text-xs">
                        {errors.firstName.message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-200 text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    {...register('lastName')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                      errors.lastName ? 'border-red-500' : ''
                    }`}
                    onKeyDown={e => handleKeyDown(e, 'lastName')}
                  />
                  {errors.lastName && (
                    <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span className="font-medium">Last name required</span>
                      </div>
                      <p className="mt-1 text-red-300 text-xs">
                        {errors.lastName.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                {/* Hidden field to prevent browser autocomplete */}
                <input
                  type="text"
                  name="fake_username"
                  autoComplete="username"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />
                <Label htmlFor="username" className="text-slate-200 text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="user_handle"
                    type="text"
                    placeholder="Choose a username"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    {...register('username')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-8 ${
                      errors.username ? 'border-red-500' : ''
                    }`}
                    onKeyDown={e => handleKeyDown(e, 'username')}
                  />
                  {usernameChecking ? (
                    <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-slate-400" />
                  ) : usernameAvailable === true ? (
                    <div className="absolute right-2 top-2 h-4 w-4 text-green-400">✓</div>
                  ) : usernameAvailable === false ? (
                    <div className="absolute right-2 top-2 h-4 w-4 text-red-400">✗</div>
                  ) : null}
                </div>
                {errors.username && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="font-medium">Invalid username</span>
                    </div>
                    <p className="mt-1 text-red-300 text-xs">
                      {errors.username.message}
                    </p>
                  </div>
                )}
                {!errors.username && username && username.length >= 3 && (
                  <p className={`text-sm ${
                    usernameAvailable === true ? 'text-green-400' : 
                    usernameAvailable === false ? 'text-red-400' : 
                    'text-slate-400'
                  }`}>
                    {usernameAvailable === true ? '✓ Username available' :
                     usernameAvailable === false ? '✗ Username already taken' :
                     'Checking availability...'}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200 text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  onKeyDown={e => handleKeyDown(e, 'email')}
                />
                {watch('email') && (
                  <SimpleEmailValidator
                    email={watch('email')}
                    onValidationChange={handleEmailValidationChange}
                  />
                )}
                {errors.email && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="font-medium">Invalid email</span>
                    </div>
                    <p className="mt-1 text-red-300 text-xs">
                      {errors.email.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                {/* Hidden fields to prevent browser autocomplete */}
                <input
                  type="password"
                  name="fake_password"
                  autoComplete="new-password"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />
                <input
                  type="password"
                  name="fake_current_password"
                  autoComplete="current-password"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />
                <Label htmlFor="password" className="text-slate-200 text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="user_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    {...register('password')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10 ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300"
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
                  <SimplePasswordValidator password={password} />
                )}
                {errors.password && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="font-medium">Invalid password</span>
                    </div>
                    <p className="mt-1 text-red-300 text-xs">
                      {errors.password.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200 text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="user_confirm_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    {...register('confirmPassword')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10 ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="font-medium">Password confirmation invalid</span>
                    </div>
                    <p className="mt-1 text-red-300 text-xs">
                      {errors.confirmPassword.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Coupon Code Field */}
              <div className="space-y-2">
                <Label htmlFor="coupon_code" className="text-slate-200 text-sm font-medium">
                  Coupon Code (Optional)
                </Label>
                <Input
                  id="coupon_code"
                  type="text"
                  placeholder="Enter coupon code if you have one"
                  {...register('coupon_code')}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                  <p className="text-xs text-slate-400">
                    Coupon codes can unlock premium features or extend your trial period.
                  </p>
                </div>
              </div>

              {/* Email Marketing Consent Checkbox */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="emailMarketingConsent"
                    checked={watch('emailMarketingConsent') || false}
                    onCheckedChange={(checked) => {
                      setValue('emailMarketingConsent', checked === true);
                    }}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="emailMarketingConsent" className="text-slate-200 text-sm">
                      I authorize Axisor Bot to contact me by email about products, services, or events.
                    </Label>
                    <p className="text-xs text-slate-400">
                      This is optional and you can unsubscribe at any time.
                    </p>
                  </div>
                </div>
                {errors.emailMarketingConsent && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="font-medium">Email marketing consent error</span>
                    </div>
                    <p className="mt-1 text-red-300">
                      {errors.emailMarketingConsent.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms and Conditions Consent Checkbox */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="termsConsent"
                    checked={watch('termsConsent') || false}
                    onCheckedChange={(checked) => {
                      setValue('termsConsent', checked === true);
                    }}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="termsConsent" className="text-slate-200 text-sm">
                      I accept the{' '}
                      <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                        Terms of Use
                      </Link>
                      {' '}and acknowledge the{' '}
                      <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                        Privacy Policy
                      </Link>
                      {' '}and{' '}
                      <Link to="/cookies" className="text-blue-400 hover:text-blue-300">
                        Cookie Policy
                      </Link>
                    </Label>
                    <p className="text-xs text-slate-400">
                      You must accept the terms and conditions to continue.
                    </p>
                  </div>
                </div>
                {errors.termsConsent && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="font-medium">Terms and conditions required</span>
                    </div>
                    <p className="mt-1 text-red-300">
                      {errors.termsConsent.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Continue Button */}
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting || !emailValidation.isValid || !emailValidation.isAvailable}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                  'Continue'
                  )}
                </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">or</span>
              </div>
            </div>

            {/* Social Registration Buttons */}
            <div className="space-y-3">
              {/* Google Registration */}
              <Button
                type="button"
                variant="outline"
                disabled={true}
                className="w-full bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:text-white hover:border-slate-500 transition-all duration-200 py-2.5 opacity-50 cursor-not-allowed"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* GitHub Registration */}
              <Button
                type="button"
                variant="outline"
                disabled={true}
                className="w-full bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:text-white hover:border-slate-500 transition-all duration-200 py-2.5 opacity-50 cursor-not-allowed"
              >
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Links */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <Link to="/terms" className="hover:text-slate-400 transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy
            </Link>
            <Link to="/docs" className="hover:text-slate-400 transition-colors">
              Docs
            </Link>
            <Link to="/support" className="hover:text-slate-400 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}