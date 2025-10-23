import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
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
import { Loader2, Eye, EyeOff, Github, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { useRegistration } from '@/hooks/useRegistration';
import SimpleEmailValidator from '@/components/SimpleEmailValidator';
import SimplePasswordValidator from '@/components/SimplePasswordValidator';
import '@/styles/register-improvements.css';

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
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/, 'Password must contain at least: 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character'),
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
  const [showCoupon, setShowCoupon] = useState(false);
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

  // Auto-fill function for testing
  const autoFillForm = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    const randomNumber = Math.floor(Math.random() * 1000) + 100; // Gera número entre 100-999
    const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Rafael', 'Camila', 'Diego', 'Fernanda'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];
    const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'teste.com'];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const randomUsername = `${randomFirstName.toLowerCase()}${randomId}`;
    const randomEmail = `${randomUsername}@${randomDomain}`;
    const randomPassword = `Test${randomNumber}!@#`;
    
    // Set form values
    setValue('firstName', randomFirstName);
    setValue('lastName', randomLastName);
    setValue('username', randomUsername);
    setValue('email', randomEmail);
    setValue('password', randomPassword);
    setValue('confirmPassword', randomPassword);
    setValue('coupon_code', '');
    setValue('emailMarketingConsent', true);
    setValue('termsConsent', true);
    
    // Clear any existing errors
    clearError();
    
    // Trigger validations after setting values
    setTimeout(() => {
      // Trigger username validation
      checkUsername(randomUsername);
      
      // Trigger email validation by simulating change
      handleEmailValidationChange(true, true, []);
      
      console.log('🤖 AUTO-FILL - Validations triggered for:', {
        firstName: randomFirstName,
        lastName: randomLastName,
        username: randomUsername,
        email: randomEmail,
        password: '***'
      });
    }, 100);
    
    console.log('🤖 AUTO-FILL - Form populated with test data:', {
      firstName: randomFirstName,
      lastName: randomLastName,
      username: randomUsername,
      email: randomEmail,
      password: '***'
    });
  };

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

              {/* Name Fields - Responsive Layout */}
              <div className="register-name-fields grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-200 text-sm font-medium">
                    First Name
                  </Label>
                  <ValidatedInput
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                    fieldName="firstName"
                    error={errors.firstName}
                    isValid={!errors.firstName && watch('firstName') && watch('firstName').length > 0}
                    value={watch('firstName')}
                    {...register('firstName')}
                    onKeyDown={e => handleKeyDown(e, 'firstName')}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                  />
                  {errors.firstName && (
                    <div className="register-error-message">
                      <div className="error-icon"></div>
                      <div>
                        <div className="font-medium">First name required</div>
                        <p className="text-xs mt-1">
                          {errors.firstName.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-200 text-sm font-medium">
                    Last Name
                  </Label>
                  <ValidatedInput
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    autoComplete="family-name"
                    fieldName="lastName"
                    error={errors.lastName}
                    isValid={!errors.lastName && watch('lastName') && watch('lastName').length > 0}
                    value={watch('lastName')}
                    {...register('lastName')}
                    onKeyDown={e => handleKeyDown(e, 'lastName')}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                  />
                  {errors.lastName && (
                    <div className="register-error-message">
                      <div className="error-icon"></div>
                      <div>
                        <div className="font-medium">Last name required</div>
                        <p className="text-xs mt-1">
                          {errors.lastName.message}
                        </p>
                      </div>
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
                <ValidatedInput
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
                  fieldName="username"
                  error={errors.username || 
                         (username && username.includes('@')) ||
                         (username && /\.(com|com\.br|org|net|edu|gov|mil|int|co\.uk|co\.jp|co\.kr|co\.in|co\.za|co\.nz|com\.au|com\.mx|com\.ar|com\.pe|com\.co|com\.ve|org\.br|net\.br|edu\.br|gov\.br|mil\.br|info|biz|name|pro|aero|coop|museum|travel|jobs|mobi|tel|asia|cat|post|xxx|arpa|local|test|example|invalid)$/i.test(username)) ||
                         (usernameAvailable === false && username && username.length >= 3)}
                  isValid={usernameAvailable === true && username && username.length >= 3 && 
                           !username.includes('@') && 
                           !/\.(com|com\.br|org|net|edu|gov|mil|int|co\.uk|co\.jp|co\.kr|co\.in|co\.za|co\.nz|com\.au|com\.mx|com\.ar|com\.pe|com\.co|com\.ve|org\.br|net\.br|edu\.br|gov\.br|mil\.br|info|biz|name|pro|aero|coop|museum|travel|jobs|mobi|tel|asia|cat|post|xxx|arpa|local|test|example|invalid)$/i.test(username)}
                  isChecking={usernameChecking}
                  value={username}
                  showValidationIcon={false}
                  {...register('username')}
                  onKeyDown={e => handleKeyDown(e, 'username')}
                />
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
                {!errors.username && username && (
                  <p className={`text-sm ${
                    username.length < 3 ? 'text-yellow-400' :
                    username.includes('@') ? 'text-red-400' :
                    /\.(com|com\.br|org|net|edu|gov|mil|int|co\.uk|co\.jp|co\.kr|co\.in|co\.za|co\.nz|com\.au|com\.mx|com\.ar|com\.pe|com\.co|com\.ve|org\.br|net\.br|edu\.br|gov\.br|mil\.br|info|biz|name|pro|aero|coop|museum|travel|jobs|mobi|tel|asia|cat|post|xxx|arpa|local|test|example|invalid)$/i.test(username) ? 'text-red-400' :
                    usernameAvailable === true ? 'text-green-400' : 
                    usernameAvailable === false ? 'text-red-400' : 
                    'text-slate-400'
                  }`}>
                    {username.length < 3 ? '⚠ Username must be at least 3 characters' :
                     username.includes('@') ? '✗ Username cannot contain @ symbol' :
                     /\.(com|com\.br|org|net|edu|gov|mil|int|co\.uk|co\.jp|co\.kr|co\.in|co\.za|co\.nz|com\.au|com\.mx|com\.ar|com\.pe|com\.co|com\.ve|org\.br|net\.br|edu\.br|gov\.br|mil\.br|info|biz|name|pro|aero|coop|museum|travel|jobs|mobi|tel|asia|cat|post|xxx|arpa|local|test|example|invalid)$/i.test(username) ? '✗ Username cannot end with email domains (.com, .org, etc.)' :
                     usernameAvailable === true ? '✓ Username available' :
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
                <ValidatedInput
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  fieldName="email"
                  error={errors.email || (!emailValidation.isAvailable && emailValidation.isValid)}
                  isValid={emailValidation.isValid && emailValidation.isAvailable}
                  value={watch('email')}
                  {...register('email')}
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
                  <ValidatedInput
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
                    fieldName="password"
                    error={errors.password}
                    isValid={!errors.password && password && password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)}
                    value={password}
                    showValidationIcon={false}
                    className="pr-10"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="register-touch-target absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  <ValidatedInput
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
                    fieldName="confirmPassword"
                    error={errors.confirmPassword || (watch('confirmPassword') && watch('confirmPassword') !== password && watch('confirmPassword').length > 0)}
                    isValid={!errors.confirmPassword && watch('confirmPassword') && watch('confirmPassword') === password && password && password.length >= 8}
                    value={watch('confirmPassword')}
                    showValidationIcon={false}
                    className="pr-10"
                    {...register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="register-touch-target absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                {!errors.confirmPassword && watch('confirmPassword') && (
                  <p className={`text-sm ${
                    watch('confirmPassword') === password && password && password.length >= 8 ? 'text-green-400' :
                    watch('confirmPassword') !== password && watch('confirmPassword').length > 0 ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {watch('confirmPassword') === password && password && password.length >= 8 ? '✓ Passwords match' :
                     watch('confirmPassword') !== password && watch('confirmPassword').length > 0 ? '✗ Passwords do not match' :
                     'Enter password confirmation'}
                  </p>
                )}
              </div>

              {/* Coupon Code Field - Progressive Disclosure */}
              <div className="space-y-2">
                {!showCoupon ? (
                  <button
                    type="button"
                    onClick={() => setShowCoupon(true)}
                    className="register-coupon-toggle"
                    aria-label="I have a coupon code"
                  >
                    <Info className="h-4 w-4" />
                    I have a coupon code
                  </button>
                ) : (
                  <div className="register-coupon-field expanded">
                    <Label htmlFor="coupon_code" className="text-slate-200 text-sm font-medium">
                      Coupon Code (Optional)
                    </Label>
                    <Input
                      id="coupon_code"
                      type="text"
                      placeholder="Enter coupon code if you have one"
                      autoComplete="off"
                      {...register('coupon_code')}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                    />
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                      <p className="text-xs text-slate-400">
                        Coupon codes can unlock premium features or extend your trial period.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Consent Group - Enhanced Layout */}
              <div className="register-consent-group">
                {/* Terms and Conditions Consent Checkbox - Required */}
                <div className="register-consent-item">
                  <Checkbox
                    id="termsConsent"
                    checked={watch('termsConsent') || false}
                    onCheckedChange={(checked) => {
                      setValue('termsConsent', checked === true);
                    }}
                    className="register-touch-target"
                    aria-describedby="terms-description"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="termsConsent" className="text-slate-200 text-sm">
                      I accept the{' '}
                      <Link 
                        to="/terms" 
                        className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1"
                      >
                        Terms of Use
                      </Link>
                      {' '}and acknowledge the{' '}
                      <Link 
                        to="/privacy" 
                        className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1"
                      >
                        Privacy Policy
                      </Link>
                      {' '}and{' '}
                      <Link 
                        to="/cookies" 
                        className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1"
                      >
                        Cookie Policy
                      </Link>
                    </Label>
                    <p id="terms-description" className="text-xs text-slate-400">
                      You must accept the terms and conditions to continue.
                    </p>
                  </div>
                </div>
                {errors.termsConsent && (
                  <div className="register-error-message">
                    <div className="error-icon"></div>
                    <div>
                      <div className="font-medium">Terms and conditions required</div>
                      <p className="text-xs mt-1">
                        {errors.termsConsent.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Marketing Consent Checkbox - Optional */}
                <div className="register-consent-item">
                  <Checkbox
                    id="emailMarketingConsent"
                    checked={watch('emailMarketingConsent') || false}
                    onCheckedChange={(checked) => {
                      setValue('emailMarketingConsent', checked === true);
                    }}
                    className="register-touch-target"
                    aria-describedby="marketing-description"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="emailMarketingConsent" className="text-slate-200 text-sm">
                      I authorize Axisor Bot to contact me by email about products, services, or events.
                    </Label>
                    <p id="marketing-description" className="text-xs text-slate-400">
                      Optional. You can unsubscribe at any time.
                    </p>
                  </div>
                </div>
                {errors.emailMarketingConsent && (
                  <div className="register-error-message">
                    <div className="error-icon"></div>
                    <div>
                      <div className="font-medium">Email marketing consent error</div>
                      <p className="text-xs mt-1">
                        {errors.emailMarketingConsent.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-fill Button for Testing */}
              <Button
                type="button"
                variant="outline"
                onClick={autoFillForm}
                className="w-full bg-yellow-600/20 border-yellow-500 text-yellow-300 hover:bg-yellow-600/30 hover:text-yellow-200 hover:border-yellow-400 transition-all duration-200 py-2.5 mb-4"
              >
                🤖 Auto-fill Test Data
              </Button>

              {/* Continue Button - Enhanced CTA */}
              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !emailValidation.isValid || !emailValidation.isAvailable}
                className="register-cta-button w-full text-white font-medium py-3 min-h-[48px] transition-all duration-200 shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
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

            {/* Social Registration Buttons - Enhanced States */}
            <div className="space-y-3">
              {/* Google Registration */}
              <Button
                type="button"
                variant="outline"
                disabled={true}
                aria-disabled="true"
                className="register-sso-button w-full bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:text-white hover:border-slate-500 transition-all duration-200 py-3 min-h-[48px] opacity-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                title="Google SSO unavailable in beta"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
                <span className="ml-2 text-xs text-slate-500">(Unavailable in beta)</span>
              </Button>

              {/* GitHub Registration */}
              <Button
                type="button"
                variant="outline"
                disabled={true}
                aria-disabled="true"
                className="register-sso-button w-full bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:text-white hover:border-slate-500 transition-all duration-200 py-3 min-h-[48px] opacity-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                title="GitHub SSO unavailable in beta"
              >
                <Github className="mr-2 h-4 w-4" aria-hidden="true" />
                Continue with GitHub
                <span className="ml-2 text-xs text-slate-500">(Unavailable in beta)</span>
              </Button>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1 py-1 min-h-[44px] inline-flex items-center"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Links - Enhanced Touch Targets */}
        <div className="text-center">
          <div className="register-footer-links">
            <Link 
              to="/terms" 
              className="hover:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-2 min-h-[44px] inline-flex items-center"
            >
              Terms
            </Link>
            <Link 
              to="/privacy" 
              className="hover:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-2 min-h-[44px] inline-flex items-center"
            >
              Privacy
            </Link>
            <Link 
              to="/docs" 
              className="hover:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-2 min-h-[44px] inline-flex items-center"
            >
              Docs
            </Link>
            <Link 
              to="/support" 
              className="hover:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-2 min-h-[44px] inline-flex items-center"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}