import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Loader2, Eye, EyeOff, Github, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/components/ui/use-toast';
import '@/styles/login-improvements.css';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Verificar se o usuário vem da verificação de email
  useEffect(() => {
    const verified = searchParams.get('verified');
    const message = searchParams.get('message');
    const email = searchParams.get('email');

    if (verified === 'true' && message === 'account_created') {
      toast({
        title: '🎉 Conta criada com sucesso!',
        description: email 
          ? `Sua conta foi verificada e está pronta para uso. Faça login com ${email} para continuar.`
          : 'Sua conta foi verificada e está pronta para uso. Faça login para continuar.',
        duration: 8000,
      });
    }
  }, [searchParams, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('🔄 LOGIN FORM - onSubmit called with data:', data);
    console.log('🔄 LOGIN FORM - emailOrUsername:', data.emailOrUsername);
    console.log('🔄 LOGIN FORM - password length:', data.password?.length || 0);
    
    try {
      console.log('🔄 LOGIN FORM - Calling clearError...');
      clearError();
      
      console.log('🔄 LOGIN FORM - Calling login function...');
      await login(data.emailOrUsername, data.password);
      
      // O redirecionamento será feito automaticamente pelo PublicRoute
      // baseado no campo is_admin que vem do backend
      console.log('✅ LOGIN - Login successful, redirecting will be handled by PublicRoute');
    } catch (error) {
      console.log('❌ LOGIN FORM - Error in onSubmit:', error);
      // Error is handled by the store
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked - not implemented yet');
  };

  const handleGitHubLogin = () => {
    // TODO: Implement GitHub OAuth
    console.log('GitHub login clicked - not implemented yet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to Axisor Bot</h1>
        </div>

        {/* Main Login Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername" className="text-slate-200 text-sm font-medium">
                  Email or Username
                </Label>
                <Input
                  id="emailOrUsername"
                  type="email"
                  placeholder="Enter your email or username"
                  autoComplete="username"
                  autoFocus
                  {...register('emailOrUsername')}
                  className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                    errors.emailOrUsername ? 'border-red-500' : ''
                  }`}
                />
                {errors.emailOrUsername && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.emailOrUsername.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200 text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="login_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    {...register('password')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 pr-12 ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300 min-w-[44px] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
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
                {errors.password && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => {
                  console.log('🔄 LOGIN FORM - Submit button clicked!');
                  console.log('🔄 LOGIN FORM - isLoading:', isLoading);
                  console.log('🔄 LOGIN FORM - errors:', errors);
                }}
                className="login-cta-button w-full text-white font-medium py-3 min-h-[48px] transition-all duration-200 shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              {/* Forgot Password Link - Single occurrence below CTA */}
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-2 py-1 min-h-[44px] inline-flex items-center"
                >
                  Forgot password?
                </Link>
              </div>
            </form>

            {/* Divider */}
            <div className="login-divider" role="separator" aria-label="or">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">or</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Google Login */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={true}
                aria-disabled="true"
                className="login-sso-button w-full bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:text-white hover:border-slate-500 transition-all duration-200 py-3 min-h-[48px] opacity-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
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

              {/* GitHub Login */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGitHubLogin}
                disabled={true}
                aria-disabled="true"
                className="login-sso-button w-full bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:text-white hover:border-slate-500 transition-all duration-200 py-3 min-h-[48px] opacity-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                title="GitHub SSO unavailable in beta"
              >
                <Github className="mr-2 h-4 w-4" aria-hidden="true" />
                Continue with GitHub
                <span className="ml-2 text-xs text-slate-500">(Unavailable in beta)</span>
              </Button>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-3">
              <p className="text-slate-400 text-sm">
                New to Axisor Bot?{' '}
                <Link
                  to="/register"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1 py-1 min-h-[44px] inline-flex items-center"
                >
                  Create an account
                </Link>
              </p>
              <p className="text-slate-400 text-sm">
                Trouble signing in?{' '}
                <Link
                  to="/forgot-password"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1 py-1 min-h-[44px] inline-flex items-center"
                >
                  Password reset
                </Link>
                {' • '}
                <Link
                  to="/support"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1 py-1 min-h-[44px] inline-flex items-center"
                >
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Links */}
        <div className="text-center">
          <div className="login-footer-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/docs">Docs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}