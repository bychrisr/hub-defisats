import React, { useState } from 'react';
import { ChevronDown, Search, Plus, MoreVertical, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
import { useTheme } from '@/contexts/ThemeContext';
import { CreateAccountModal } from '@/components/modals/CreateAccountModal';
import { AccountActionsModal } from '@/components/modals/AccountActionsModal';
import { UserExchangeAccount } from '@/services/userExchangeAccount.service';
import { cn } from '@/lib/utils';

export const AccountSelector = () => {
  const { accounts, getActiveAccount, setActiveAccount, isLoading, loadAccounts } = useUserExchangeAccounts();
  const activeAccount = getActiveAccount();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<UserExchangeAccount | null>(null);

  const filteredAccounts = accounts.filter(account =>
    account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.exchange.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAccountChange = async (accountId: string) => {
    try {
      await setActiveAccount(accountId);
      setIsOpen(false);
    } catch (error) {
      console.error('❌ ACCOUNT SELECTOR - Error changing account:', error);
    }
  };

  const handleCreateAccount = () => {
    setIsCreateModalOpen(true);
    setIsOpen(false);
  };

  const handleAccountActions = (account: UserExchangeAccount) => {
    setSelectedAccount(account);
    setIsActionsModalOpen(true);
    setIsOpen(false);
  };

  const handleModalSuccess = () => {
    loadAccounts(); // Refresh accounts list
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center space-x-2 px-3 py-2 h-auto min-w-0",
            "hover:bg-primary/10 transition-all duration-200"
          )}
        >
          {/* Account Info */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-text-primary truncate">
              {activeAccount?.account_name || 'No Account'}
            </span>
            <span className="text-xs text-text-secondary truncate">
              {activeAccount?.exchange.name || 'Unknown Exchange'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-text-secondary" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className={cn(
          "w-56 p-0",
          theme === 'dark' ? 'dropdown-glassmorphism' : 'dropdown-glassmorphism-light'
        )}
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <h3 className="text-lg font-semibold text-text-primary">Accounts</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0 hover:bg-primary/10"
          >
            ×
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-transparent border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Accounts List */}
        <div className="max-h-64 overflow-y-auto">
          {filteredAccounts.length === 0 ? (
            <div className="p-4 text-center text-text-secondary">
              {searchTerm ? 'No accounts found' : 'No accounts available'}
            </div>
          ) : (
            filteredAccounts.map((account) => {
              const isActive = account.id === activeAccount?.id;
              
              return (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => handleAccountChange(account.id)}
                  className={cn(
                    "flex items-center space-x-3 p-3 cursor-pointer",
                    "hover:bg-primary/5 transition-colors duration-200",
                    isActive && "bg-primary/10"
                  )}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="w-1 h-8 bg-primary rounded-full" />
                  )}
                  
                  {/* Account Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {account.account_name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {isActive && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccountActions(account);
                          }}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-text-secondary">
                        {account.exchange.name}
                      </span>
                      {account.is_active && (
                        <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {/* Add Account Button */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full justify-center space-x-2 hover:bg-primary/10"
            onClick={handleCreateAccount}
          >
            <Plus className="h-4 w-4" />
            <span>Add Exchange Account</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Modals */}
    <CreateAccountModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onSuccess={handleModalSuccess}
    />

      <AccountActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
        account={selectedAccount}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};
