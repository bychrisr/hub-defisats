import React, { useState } from 'react';
import { ChevronDown, Search, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAccounts } from '@/contexts/AccountContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ACCOUNT_PROVIDERS } from '@/types/account';
import { cn } from '@/lib/utils';

export const AccountSelector = () => {
  const { accounts, activeAccount, setActiveAccount } = useAccounts();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProvider = activeAccount ? ACCOUNT_PROVIDERS[activeAccount.provider] : null;

  return (
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
              {activeAccount?.name || 'No Account'}
            </span>
            <span className="text-xs text-text-secondary truncate">
              {activeProvider?.name || 'Unknown Provider'}
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
        <div className="flex items-center justify-between p-4 border-b border-border/50">
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
        <div className="p-4 border-b border-border/50">
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
              const provider = ACCOUNT_PROVIDERS[account.provider];
              const isActive = account.id === activeAccount?.id;
              
              return (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    setActiveAccount(account);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center space-x-3 p-4 cursor-pointer",
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
                        {account.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-text-secondary">
                          {account.balance ? `$${account.balance.toFixed(2)} ${account.currency}` : '$0.00 USD'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement account options menu
                          }}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {provider.name}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {/* Add Account Button */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full justify-center space-x-2 hover:bg-primary/10"
            onClick={() => {
              // TODO: Implement add account functionality
              console.log('Add account clicked');
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add account or wallet</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
