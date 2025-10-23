import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useRegistration } from '@/hooks/useRegistration';

interface Exchange {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  api_version?: string;
  credential_types: CredentialType[];
}

interface CredentialType {
  id: string;
  name: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  order: number;
}

interface UserAccount {
  id: string;
  exchange_id: string;
  account_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_test?: string;
  created_at: string;
  exchange: {
    name: string;
    slug: string;
    logo_url?: string;
  };
}

interface PlanLimits {
  max_exchange_accounts: number;
  max_automations: number;
  max_indicators: number;
  max_simulations: number;
  max_backtests: number;
}

function RegisterCredentialsNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveCredentials } = useRegistration();
  
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [accountName, setAccountName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingCredentials, setTestingCredentials] = useState<string | null>(null);

  // Get data from location state
  const personalData = location.state?.personalData;
  const selectedPlan = typeof location.state?.selectedPlan === 'string' 
    ? location.state.selectedPlan 
    : location.state?.selectedPlan?.planId;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // During registration, only load exchanges (public)
      // User accounts and plan limits will be loaded after authentication
      const exchangesRes = await fetch('/api/registration/exchanges');

      if (!exchangesRes.ok) {
        throw new Error('Failed to load exchanges');
      }

      const exchangesData = await exchangesRes.json();
      setExchanges(exchangesData.data || []);
      
      // Set default plan limits for registration
      setPlanLimits({
        max_exchange_accounts: 1, // Default for free plan
        max_automations: 5,
        max_indicators: 10,
        max_simulations: 3,
        max_backtests: 5,
      });
      
      // No user accounts during registration
      setUserAccounts([]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeChange = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    setCredentials({});
    
    const exchange = exchanges.find(e => e.id === exchangeId);
    if (exchange) {
      // Initialize credentials with empty values
      const initialCredentials: Record<string, string> = {};
      exchange.credential_types.forEach(ct => {
        initialCredentials[ct.field_name] = '';
      });
      setCredentials(initialCredentials);
    }
  };

  const handleCredentialChange = (fieldName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleCreateAccount = async () => {
    if (!selectedExchange || !accountName.trim()) {
      setError('Please select an exchange and enter an account name');
      return;
    }

    const exchange = exchanges.find(e => e.id === selectedExchange);
    if (!exchange) {
      setError('Invalid exchange selected');
      return;
    }

    // Validate required credentials
    const missingFields = exchange.credential_types
      .filter(ct => ct.is_required && (!credentials[ct.field_name] || credentials[ct.field_name].trim() === ''))
      .map(ct => ct.name);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Save credentials to registration progress
      await saveCredentials({
        exchangeId: selectedExchange,
        accountName: accountName.trim(),
        credentials,
        sessionToken: location.state?.sessionToken,
      });

      // Navigate to onboarding
      navigate('/onboarding', {
        state: {
          fromRegistration: true,
          sessionToken: location.state?.sessionToken,
          message: 'Welcome to Axisor! Let us show you around.',
        },
      });
      
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      setError(error.message || 'Failed to save credentials');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSkip = () => {
    navigate('/onboarding', {
      state: {
        fromRegistration: true,
        message: 'Registration completed! Take a quick tour to learn the platform.',
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-400">Loading exchanges...</p>
        </div>
      </div>
    );
  }

  const selectedExchangeData = exchanges.find(e => e.id === selectedExchange);
  const canAddMoreAccounts = planLimits && userAccounts.length < planLimits.max_exchange_accounts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Connect Your Exchange Accounts
          </h1>
          <p className="text-slate-400">
            Add your trading exchange credentials to start automating your trades
          </p>
        </div>

        {/* Plan Limits Info */}
        {planLimits && (
          <div className="mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Your Plan Limits</h3>
                    <p className="text-slate-400 text-sm">
                      You can add up to {planLimits.max_exchange_accounts} exchange accounts
                    </p>
                  </div>
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    {userAccounts.length} / {planLimits.max_exchange_accounts} accounts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Registration Info */}
        <div className="mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Connect Your First Exchange</h2>
                <p className="text-slate-400 mb-4">
                  Add your trading exchange credentials to start automating your trades. You can add more accounts later from your profile.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                  <span>• Choose your exchange</span>
                  <span>• Enter your credentials</span>
                  <span>• Start trading</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Account */}
        {canAddMoreAccounts && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Add New Exchange Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exchange Selection */}
              <div>
                <Label htmlFor="exchange" className="text-slate-300">Exchange</Label>
                <Select value={selectedExchange} onValueChange={handleExchangeChange}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select an exchange" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {exchanges.map((exchange) => (
                      <SelectItem key={exchange.id} value={exchange.id} className="text-white">
                        <div className="flex items-center space-x-2">
                          {exchange.logo_url && (
                            <img
                              src={exchange.logo_url}
                              alt={exchange.name}
                              className="h-4 w-4 rounded"
                            />
                          )}
                          <span>{exchange.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account Name */}
              <div>
                <Label htmlFor="accountName" className="text-slate-300">Account Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., Main Account, Trading Account"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {/* Credentials */}
              {selectedExchangeData && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Credentials</h4>
                  {selectedExchangeData.credential_types.map((credType) => (
                    <div key={credType.id}>
                      <Label htmlFor={credType.field_name} className="text-slate-300">
                        {credType.name}
                        {credType.is_required && <span className="text-red-400 ml-1">*</span>}
                      </Label>
                      <Input
                        id={credType.field_name}
                        type={credType.field_type === 'password' ? 'password' : 'text'}
                        value={credentials[credType.field_name] || ''}
                        onChange={(e) => handleCredentialChange(credType.field_name, e.target.value)}
                        placeholder={credType.description || `Enter ${credType.name.toLowerCase()}`}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                      {credType.description && (
                        <p className="text-slate-500 text-sm mt-1">{credType.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Create Account Button */}
              <Button
                onClick={handleCreateAccount}
                disabled={!selectedExchange || !accountName.trim() || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating Account...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" /> Add Account</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cannot Add More Accounts */}
        {!canAddMoreAccounts && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Account Limit Reached</h3>
              <p className="text-slate-400 mb-4">
                You have reached the maximum number of exchange accounts for your plan.
              </p>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
              >
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Skip for now (I'll add credentials later)
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            You can add more exchange accounts later from your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterCredentialsNew;
