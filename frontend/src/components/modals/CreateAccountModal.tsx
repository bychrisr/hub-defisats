import { useState, useEffect } from 'react';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
import { useExchangeCredentials } from '@/hooks/useExchangeCredentials';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateAccountModal({ isOpen, onClose, onSuccess }: CreateAccountModalProps) {
  const { createAccount } = useUserExchangeAccounts();
  const { exchanges, isLoading: isLoadingExchanges } = useExchangeCredentials();
  const { getAccountStats } = usePlanLimits();

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    exchange_id: '',
    account_name: '',
    credentials: {} as Record<string, string>
  });
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        exchange_id: '',
        account_name: '',
        credentials: {}
      });
      setShowCredentials({});
    }
  }, [isOpen]);

  const selectedExchange = exchanges.find(ex => ex.id === form.exchange_id);
  const accountStats = getAccountStats(0); // We'll get the real count from parent

  const handleCreate = async () => {
    if (!form.exchange_id || !form.account_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate credentials
    if (selectedExchange?.credential_types) {
      const requiredFields = selectedExchange.credential_types.map(ct => ct.name);
      const missingFields = requiredFields.filter(field => !form.credentials[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing Credentials",
          description: `Please fill in: ${missingFields.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setIsCreating(true);
      
      await createAccount({
        exchange_id: form.exchange_id,
        account_name: form.account_name,
        credentials: form.credentials
      });

      toast({
        title: "Success",
        description: "Exchange account created successfully"
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ CREATE ACCOUNT MODAL - Error creating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCredentialVisibility = (field: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Exchange Account</DialogTitle>
          <DialogDescription>
            Add a new exchange account for automated trading
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Exchange Selection */}
          <div className="space-y-2">
            <Label htmlFor="exchange">Exchange</Label>
            <select
              id="exchange"
              value={form.exchange_id}
              onChange={(e) => setForm(prev => ({ 
                ...prev, 
                exchange_id: e.target.value,
                credentials: {} // Reset credentials when exchange changes
              }))}
              className="coingecko-input w-full"
            >
              <option value="">Select an exchange</option>
              {exchanges.map((exchange) => (
                <option key={exchange.id} value={exchange.id}>
                  {exchange.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="account_name">Account Name</Label>
            <Input
              id="account_name"
              value={form.account_name}
              onChange={(e) => setForm(prev => ({ ...prev, account_name: e.target.value }))}
              placeholder="e.g., Main Account, Trading Bot"
            />
          </div>

          {/* Dynamic Credentials */}
          {selectedExchange?.credential_types && (
            <div className="space-y-4">
              <Label>Credentials</Label>
              {selectedExchange.credential_types.map((credType) => (
                <div key={credType.id} className="space-y-2">
                  <Label htmlFor={credType.name}>{credType.label}</Label>
                  <div className="relative">
                    <Input
                      id={credType.name}
                      type={showCredentials[credType.name] ? 'text' : 'password'}
                      value={form.credentials[credType.name] || ''}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        credentials: {
                          ...prev.credentials,
                          [credType.name]: e.target.value
                        }
                      }))}
                      placeholder={`Enter ${credType.label.toLowerCase()}`}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleCredentialVisibility(credType.name)}
                    >
                      {showCredentials[credType.name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
