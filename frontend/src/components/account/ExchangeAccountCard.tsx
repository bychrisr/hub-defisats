import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Check, AlertCircle, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserExchangeAccount } from '@/services/userExchangeAccount.service';
import { cn } from '@/lib/utils';

interface ExchangeAccountCardProps {
  account: UserExchangeAccount;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
  onEdit?: (account: UserExchangeAccount) => void;
  onDelete?: (accountId: string) => void;
  onTest?: (accountId: string) => void;
  className?: string;
}

export const ExchangeAccountCard: React.FC<ExchangeAccountCardProps> = ({
  account,
  isActive = false,
  onSetActive,
  onEdit,
  onDelete,
  onTest,
  className,
}) => {
  const getStatusBadge = () => {
    if (account.is_verified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Check className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    
    if (account.last_test) {
      const lastTestDate = new Date(account.last_test);
      const now = new Date();
      const diffInHours = (now.getTime() - lastTestDate.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Recent Test
          </Badge>
        );
      }
    }
    
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
      <AlertCircle className="w-3 h-3 mr-1" />
      Not Verified
    </Badge>
    );
  };

  const handleSetActive = () => {
    if (onSetActive && !isActive) {
      onSetActive(account.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(account);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(account.id);
    }
  };

  const handleTest = () => {
    if (onTest) {
      onTest(account.id);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isActive && "ring-2 ring-primary ring-opacity-50 bg-primary/5",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {account.exchange.name.charAt(0)}
              </span>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {account.account_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {account.exchange.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isActive && onSetActive && (
                  <DropdownMenuItem onClick={handleSetActive}>
                    <Check className="w-4 h-4 mr-2" />
                    Set as Active
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    Edit Account
                  </DropdownMenuItem>
                )}
                {onTest && (
                  <DropdownMenuItem onClick={handleTest}>
                    Test Credentials
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete Account
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={cn(
              "font-medium",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span className="text-foreground">
              {new Date(account.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {account.last_test && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Test:</span>
              <span className="text-foreground">
                {new Date(account.last_test).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        {isActive && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center space-x-2 text-sm text-primary">
              <Check className="w-4 h-4" />
              <span className="font-medium">This is your active account</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

