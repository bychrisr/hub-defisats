import { useState } from 'react';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
import { useExchangeCredentials } from '@/hooks/useExchangeCredentials';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Key,
  TestTube,
  Star,
  StarOff,
  Edit,
  Eye,
  EyeOff,
  Infinity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MultiAccountInterface() {
  const {
    accounts,
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    setActiveAccount,
    testCredentials,
    getAccountsByExchange,
    getActiveAccount
  } = useUserExchangeAccounts();

  const { exchanges, isLoading: isLoadingExchanges } = useExchangeCredentials();
  const { user } = useAuthStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isSettingActive, setIsSettingActive] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    exchange_id: '',
    account_name: '',
    credentials: {} as Record<string, string>
  });
  const [editForm, setEditForm] = useState({
    account_name: '',
    credentials: {} as Record<string, string>
  });
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  // Função para obter limite de contas baseado no plano
  const getAccountLimit = (planType: string): number | 'unlimited' => {
    switch (planType) {
      case 'free':
        return 1;
      case 'basic':
        return 2;
      case 'premium':
        return 5;
      case 'lifetime':
        return 'unlimited';
      default:
        return 1;
    }
  };

  // Calcular estatísticas de contas
  const accountStats = {
    total: accounts.length,
    limit: getAccountLimit(user?.plan_type || 'free'),
    canCreate: user?.plan_type === 'lifetime' || 
               (typeof getAccountLimit(user?.plan_type || 'free') === 'number' && 
                accounts.length < (getAccountLimit(user?.plan_type || 'free') as number))
  };

  const handleCreateAccount = async () => {
    try {
      setIsCreating(true);
      console.log('🔄 MULTI ACCOUNT - Creating account:', createForm);

      await createAccount(createForm);
      
      toast({
        title: "Account Created",
        description: "Exchange account created successfully!",
      });

      // Reset form
      setCreateForm({
        exchange_id: '',
        account_name: '',
        credentials: {}
      });

    } catch (error: any) {
      console.error('❌ MULTI ACCOUNT - Error creating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAccount = async (accountId: string) => {
    try {
      setIsUpdating(accountId);
      console.log('🔄 MULTI ACCOUNT - Updating account:', { accountId, editForm });

      await updateAccount(accountId, editForm);
      
      toast({
        title: "Account Updated",
        description: "Exchange account updated successfully!",
      });

    } catch (error: any) {
      console.error('❌ MULTI ACCOUNT - Error updating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      setIsDeleting(accountId);
      console.log('🗑️ MULTI ACCOUNT - Deleting account:', accountId);

      await deleteAccount(accountId);
      
      toast({
        title: "Account Deleted",
        description: "Exchange account deleted successfully!",
      });

    } catch (error: any) {
      console.error('❌ MULTI ACCOUNT - Error deleting account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetActiveAccount = async (accountId: string) => {
    try {
      setIsSettingActive(accountId);
      console.log('🔄 MULTI ACCOUNT - Setting active account:', accountId);

      await setActiveAccount(accountId);
      
      toast({
        title: "Active Account Set",
        description: "Active account updated successfully!",
      });

    } catch (error: any) {
      console.error('❌ MULTI ACCOUNT - Error setting active account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set active account",
        variant: "destructive",
      });
    } finally {
      setIsSettingActive(null);
    }
  };

  const handleTestCredentials = async (accountId: string) => {
    try {
      setIsTesting(accountId);
      console.log('🧪 MULTI ACCOUNT - Testing credentials:', accountId);

      const result = await testCredentials(accountId);
      
      toast({
        title: result.success ? "Test Successful" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

    } catch (error: any) {
      console.error('❌ MULTI ACCOUNT - Error testing credentials:', error);
      toast({
        title: "Test Error",
        description: error.message || "Failed to test credentials",
        variant: "destructive",
      });
    } finally {
      setIsTesting(null);
    }
  };

  const toggleCredentialsVisibility = (accountId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  if (isLoading || isLoadingExchanges) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-muted-foreground">Loading accounts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load accounts: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Stats Header */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Exchange Accounts
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Manage your exchange connections
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {accountStats.total}
                </span>
                <span className="text-blue-700 dark:text-blue-300">
                  /
                </span>
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {accountStats.limit === 'unlimited' ? (
                    <Infinity className="h-6 w-6" />
                  ) : (
                    accountStats.limit
                  )}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {accountStats.limit === 'unlimited' ? 'Unlimited' : 'accounts'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Account Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="w-full" 
            disabled={!accountStats.canCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            {!accountStats.canCreate ? 'Account Limit Reached' : 'Add Exchange Account'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Exchange Account</DialogTitle>
            <DialogDescription>
              Add a new exchange account for automated trading
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <select
                id="exchange"
                value={createForm.exchange_id}
                onChange={(e) => setCreateForm(prev => ({ ...prev, exchange_id: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select an exchange</option>
                {exchanges.map((exchange) => (
                  <option key={exchange.id} value={exchange.id}>
                    {exchange.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                value={createForm.account_name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="e.g., Main Account, Trading Bot"
              />
            </div>

            {/* Dynamic credentials based on selected exchange */}
            {createForm.exchange_id && (
              <div className="space-y-4">
                <Separator />
                <h4 className="font-medium">API Credentials</h4>
                {exchanges
                  .find(ex => ex.id === createForm.exchange_id)
                  ?.credential_types?.map((credType) => (
                    <div key={credType.id} className="space-y-2">
                      <Label htmlFor={credType.field_name}>{credType.name}</Label>
                      <div className="relative">
                        <Input
                          id={credType.field_name}
                          type={
                            credType.field_type === 'password' 
                              ? (showCredentials[`create_${credType.field_name}`] ? 'text' : 'password')
                              : 'text'
                          }
                          value={createForm.credentials[credType.field_name] || ''}
                          onChange={(e) => setCreateForm(prev => ({
                            ...prev,
                            credentials: {
                              ...prev.credentials,
                              [credType.field_name]: e.target.value
                            }
                          }))}
                          placeholder={credType.description}
                        />
                        {credType.field_type === 'password' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => toggleCredentialsVisibility(`create_${credType.field_name}`)}
                          >
                            {showCredentials[`create_${credType.field_name}`] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCreateAccount}
                disabled={isCreating || !createForm.exchange_id || !createForm.account_name}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accounts by Exchange */}
      {exchanges.map((exchange) => {
        const exchangeAccounts = getAccountsByExchange(exchange.id);
        const activeAccount = getActiveAccount(exchange.id);

        if (exchangeAccounts.length === 0) {
          return null;
        }

        return (
          <Card key={exchange.id} className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{exchange.name}</CardTitle>
                    <CardDescription>
                      {exchangeAccounts.length} account{exchangeAccounts.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={activeAccount ? "default" : "secondary"}>
                  {activeAccount ? "Active" : "No Active Account"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {exchangeAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "p-4 border rounded-lg transition-colors",
                      account.is_active 
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" 
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{account.account_name}</h4>
                          {account.is_active && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {account.is_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {account.is_verified ? "Verified" : "Not Verified"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!account.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetActiveAccount(account.id)}
                            disabled={isSettingActive === account.id}
                          >
                            {isSettingActive === account.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                            Set Active
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestCredentials(account.id)}
                          disabled={isTesting === account.id}
                        >
                          {isTesting === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          Test
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Reset edit form with current account data
                                setEditForm({
                                  account_name: account.account_name,
                                  credentials: account.credentials || {}
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Account</DialogTitle>
                              <DialogDescription>
                                Update account settings and credentials
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit_account_name">Account Name</Label>
                                <Input
                                  id="edit_account_name"
                                  value={editForm.account_name}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, account_name: e.target.value }))}
                                  placeholder="Account name"
                                />
                              </div>

                              {/* Credentials Section */}
                              <div className="space-y-4">
                                <Separator />
                                <h4 className="font-medium">API Credentials</h4>
                                <p className="text-sm text-muted-foreground">
                                  Update your API credentials if needed
                                </p>
                                
                                {exchanges
                                  .find(ex => ex.id === account.exchange_id)
                                  ?.credential_types?.map((credType) => (
                                    <div key={credType.id} className="space-y-2">
                                      <Label htmlFor={`edit_${credType.field_name}`}>{credType.name}</Label>
                                      <div className="relative">
                                        <Input
                                          id={`edit_${credType.field_name}`}
                                          type={
                                            credType.field_type === 'password' 
                                              ? (showCredentials[`edit_${credType.field_name}`] ? 'text' : 'password')
                                              : 'text'
                                          }
                                          value={editForm.credentials[credType.field_name] || ''}
                                          onChange={(e) => setEditForm(prev => ({
                                            ...prev,
                                            credentials: {
                                              ...prev.credentials,
                                              [credType.field_name]: e.target.value
                                            }
                                          }))}
                                          placeholder={credType.description}
                                        />
                                        {credType.field_type === 'password' && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => toggleCredentialsVisibility(`edit_${credType.field_name}`)}
                                          >
                                            {showCredentials[`edit_${credType.field_name}`] ? (
                                              <EyeOff className="h-4 w-4" />
                                            ) : (
                                              <Eye className="h-4 w-4" />
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => handleUpdateAccount(account.id)}
                                  disabled={isUpdating === account.id}
                                >
                                  {isUpdating === account.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Settings className="mr-2 h-4 w-4" />
                                  )}
                                  Update Account
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{account.account_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAccount(account.id)}
                                disabled={isDeleting === account.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting === account.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>Created: {new Date(account.created_at).toLocaleDateString()}</p>
                      {account.last_test && (
                        <p>Last tested: {new Date(account.last_test).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* No Accounts Message */}
      {accounts.length === 0 && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Key className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Exchange Accounts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your first exchange account to start automated trading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
