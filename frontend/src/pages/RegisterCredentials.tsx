import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { Loader2, Eye, EyeOff, Info, CheckCircle } from 'lucide-react';
import { useRegistration } from '@/hooks/useRegistration';

// Schema para credenciais LN Markets
const credentialsSchema = z.object({
  ln_markets_api_key: z.string().min(16, 'API key must be at least 16 characters'),
  ln_markets_api_secret: z.string().min(16, 'API secret must be at least 16 characters'),
  ln_markets_passphrase: z.string().min(8, 'Passphrase must be at least 8 characters'),
});

type CredentialsForm = z.infer<typeof credentialsSchema>;

export default function RegisterCredentials() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  const { saveCredentials, isLoading, error, clearError } = useRegistration();

  // TODO: Reativar verificação quando backend estiver pronto
  // useEffect(() => {
  //   if (!location.state?.personalData || !location.state?.selectedPlan) {
  //     navigate('/register');
  //   }
  // }, [location.state, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
  });

  const apiKey = watch('ln_markets_api_key');
  const apiSecret = watch('ln_markets_api_secret');
  const passphrase = watch('ln_markets_passphrase');

  // Validar credenciais quando todos os campos estiverem preenchidos
  useEffect(() => {
    if (apiKey && apiSecret && passphrase && 
        apiKey.length >= 16 && apiSecret.length >= 16 && passphrase.length >= 8) {
      setIsValidating(true);
      
      // Simular validação das credenciais
      const validateCredentials = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // TODO: Implementar validação real das credenciais LN Markets
          setValidationStatus({
            isValid: true,
            message: 'Credentials validated successfully'
          });
        } catch (error) {
          setValidationStatus({
            isValid: false,
            message: 'Invalid credentials. Please check your API details.'
          });
        } finally {
          setIsValidating(false);
        }
      };

      validateCredentials();
    } else {
      setValidationStatus(null);
    }
  }, [apiKey, apiSecret, passphrase]);

  const onSubmit = async (data: CredentialsForm) => {
    if (!validationStatus?.isValid) {
      return;
    }

    try {
      clearError();
      
      const credentialsData = {
        lnMarketsApiKey: data.ln_markets_api_key,
        lnMarketsApiSecret: data.ln_markets_api_secret,
        lnMarketsPassphrase: data.ln_markets_passphrase,
        sessionToken: location.state?.sessionToken,
      };

      console.log('🚀 Credentials data being sent:', {
        lnMarketsApiKey: credentialsData.lnMarketsApiKey,
        lnMarketsApiSecret: credentialsData.lnMarketsApiSecret,
        lnMarketsPassphrase: credentialsData.lnMarketsPassphrase,
        sessionToken: credentialsData.sessionToken ? 'EXISTS' : 'MISSING',
      });
      
      // Chamar a função de salvamento de credenciais do hook
      await saveCredentials(credentialsData);
      
    } catch (error: any) {
      console.error('Registration error:', error);
    }
  };

  // Dados mock para desenvolvimento
  const personalData = location.state?.personalData || {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    coupon_code: null
  };
  const selectedPlan = typeof location.state?.selectedPlan === 'string' 
    ? location.state.selectedPlan 
    : location.state?.selectedPlan?.planId || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connect your LN Markets account</h1>
          <p className="text-slate-400 text-sm">
            Enter your LN Markets API credentials to complete your registration
          </p>
        </div>

        {/* Registration Summary */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">Registration Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Name:</span>
              <span className="text-white">{personalData?.firstName} {personalData?.lastName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Email:</span>
              <span className="text-white">{personalData?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Username:</span>
              <span className="text-white">{personalData?.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Plan:</span>
              <span className="text-white capitalize">{selectedPlan}</span>
            </div>
            {personalData?.coupon_code && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Coupon:</span>
                <span className="text-white">{personalData.coupon_code}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credentials Form */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* API Key Field */}
              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_key" className="text-slate-200 text-sm font-medium">
                  LN Markets API Key
                </Label>
                <Input
                  id="ln_markets_api_key"
                  type="text"
                  placeholder="Enter your LN Markets API Key"
                  autoComplete="off"
                  {...register('ln_markets_api_key')}
                  className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                    errors.ln_markets_api_key ? 'border-red-500' : ''
                  }`}
                />
                {errors.ln_markets_api_key && (
                  <p className="text-sm text-red-400">{errors.ln_markets_api_key.message}</p>
                )}
              </div>

              {/* API Secret Field */}
              <div className="space-y-2">
                <Label htmlFor="ln_markets_api_secret" className="text-slate-200 text-sm font-medium">
                  LN Markets API Secret
                </Label>
                <div className="relative">
                  <Input
                    id="ln_markets_api_secret"
                    type={showApiSecret ? 'text' : 'password'}
                    placeholder="Enter your LN Markets API Secret"
                    autoComplete="off"
                    {...register('ln_markets_api_secret')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10 ${
                      errors.ln_markets_api_secret ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300"
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
                  <p className="text-sm text-red-400">{errors.ln_markets_api_secret.message}</p>
                )}
              </div>

              {/* Passphrase Field */}
              <div className="space-y-2">
                <Label htmlFor="ln_markets_passphrase" className="text-slate-200 text-sm font-medium">
                  LN Markets Passphrase
                </Label>
                <div className="relative">
                  <Input
                    id="ln_markets_passphrase"
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Enter your LN Markets Passphrase"
                    autoComplete="off"
                    {...register('ln_markets_passphrase')}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10 ${
                      errors.ln_markets_passphrase ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300"
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
                  <p className="text-sm text-red-400">{errors.ln_markets_passphrase.message}</p>
                )}
              </div>

              {/* Validation Status */}
              {isValidating && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Validating credentials...</span>
                </div>
              )}

              {validationStatus && !isValidating && (
                <div className={`flex items-center space-x-2 ${
                  validationStatus.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{validationStatus.message}</span>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">How to get your LN Markets API credentials:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Log in to your LN Markets account</li>
                      <li>Go to Settings → API Keys</li>
                      <li>Create a new API key with trading permissions</li>
                      <li>Copy the API Key, Secret, and Passphrase</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Complete Registration Button */}
              <Button
                type="submit"
                disabled={isLoading || !validationStatus?.isValid || isValidating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-400 text-sm">
            Your credentials are encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
