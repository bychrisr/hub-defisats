import { Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlanAvatar } from '@/components/ui/PlanAvatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import { LanguageCurrencySelector } from '@/components/common/LanguageCurrencySelector';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const themeClasses = useThemeClasses();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b ${themeClasses.border} ${themeClasses.bgHeader} backdrop-blur supports-[backdrop-filter]:bg-bg-header/60 ${themeClasses.transition}`}>
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <span className={`font-bold text-lg ${themeClasses.textPrimary}`}>Axisor Bot</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <RealtimeStatus className="hidden sm:flex" />

          {/* Language & Currency Selector */}
          <LanguageCurrencySelector variant="header" compact />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
                  0
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Test Notification Button */}
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mb-2"
                  onClick={async () => {
                    try {
                      // Simular notificação do Margin Guard
                      const response = await fetch('/api/user/margin-guard/test-notification', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          type: 'margin_guard',
                          priority: 'medium',
                          title: '🛡️ Margem Adicionada',
                          message: 'Margin Guard adicionou 2,500 sats de margem à posição 12345678...',
                          metadata: {
                            tradeId: '12345678',
                            marginAdded: 2500,
                            totalCost: 2600,
                            newLiquidationPrice: 45000,
                            currentPrice: 47500,
                            triggerPrice: 46000,
                            action: 'margin_added',
                            timestamp: new Date().toISOString()
                          }
                        })
                      });
                      
                      if (response.ok) {
                        console.log('✅ Test notification sent');
                      } else {
                        console.error('❌ Failed to send test notification');
                      }
                    } catch (error) {
                      console.error('❌ Error sending test notification:', error);
                    }
                  }}
                >
                  Test Margin Guard Notification
                </Button>
              </div>
              
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <PlanAvatar
                  email={user?.email}
                  planType={(user as any)?.plan_type || 'free'}
                  size="md"
                  showBadge={true}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.plan_type.toUpperCase() || 'FREE'} Plan
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
