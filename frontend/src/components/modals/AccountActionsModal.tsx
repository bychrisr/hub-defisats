import { useState, useEffect } from 'react';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
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
import { Loader2, Eye, EyeOff, TestTube, Trash2, Edit } from 'lucide-react';
import { UserExchangeAccount } from '@/services/userExchangeAccount.service';

interface AccountActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserExchangeAccount | null;
  onSuccess?: () => void;
}

export function AccountActionsModal({ isOpen, onClose, account, onSuccess }: AccountActionsModalProps) {
  const { updateAccount, deleteAccount, testCredentials, setActiveAccount } = useUserExchangeAccounts();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const [editForm, setEditForm] = useState({
    account_name: '',
    credentials: {} as Record<string, string>
  });
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  // Initialize form when account changes
  useEffect(() => {
    if (account) {
      setEditForm({
        account_name: account.account_name,
        credentials: account.credentials || {}
      });
    }
  }, [account]);

  const handleUpdate = async () => {
    if (!account) return;

    try {
      setIsUpdating(true);
      
      await updateAccount(account.id, {
        account_name: editForm.account_name,
        credentials: editForm.credentials
      });

      toast({
        title: "Success",
        description: "Account updated successfully"
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ ACCOUNT ACTIONS MODAL - Error updating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;

    try {
      setIsDeleting(true);
      
      await deleteAccount(account.id);

      toast({
        title: "Success",
        description: "Account deleted successfully"
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ ACCOUNT ACTIONS MODAL - Error deleting account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTest = async () => {
    if (!account) return;

    try {
      setIsTesting(true);
      
      const result = await testCredentials(account.id);

      toast({
        title: result.success ? "Test Successful" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('❌ ACCOUNT ACTIONS MODAL - Error testing credentials:', error);
      toast({
        title: "Test Error",
        description: error.message || "Failed to test credentials",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetActive = async () => {
    if (!account) return;

    try {
      setIsSettingActive(true);
      
      await setActiveAccount(account.id);

      toast({
        title: "Success",
        description: "Account set as active"
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ ACCOUNT ACTIONS MODAL - Error setting active account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set active account",
        variant: "destructive"
      });
    } finally {
      setIsSettingActive(false);
    }
  };

  const toggleCredentialVisibility = (field: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Account Actions</DialogTitle>
          <DialogDescription>
            Manage your exchange account: {account.account_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="account_name">Account Name</Label>
            <Input
              id="account_name"
              value={editForm.account_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, account_name: e.target.value }))}
              placeholder="Account name"
            />
          </div>

          {/* Credentials */}
          {Object.keys(editForm.credentials).length > 0 && (
            <div className="space-y-4">
              <Label>Credentials</Label>
              {Object.entries(editForm.credentials).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{key}</Label>
                  <div className="relative">
                    <Input
                      id={key}
                      type={showCredentials[key] ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        credentials: {
                          ...prev.credentials,
                          [key]: e.target.value
                        }
                      }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleCredentialVisibility(key)}
                    >
                      {showCredentials[key] ? (
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
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              variant="outline"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Edit className="mr-2 h-4 w-4" />
              Update
            </Button>

            <Button 
              onClick={handleTest} 
              disabled={isTesting}
              variant="outline"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <TestTube className="mr-2 h-4 w-4" />
              Test
            </Button>

            {!account.is_active && (
              <Button 
                onClick={handleSetActive} 
                disabled={isSettingActive}
                variant="outline"
                className="col-span-2"
              >
                {isSettingActive && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set as Active
              </Button>
            )}

            <Button 
              onClick={handleDelete} 
              disabled={isDeleting}
              variant="destructive"
              className="col-span-2"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
