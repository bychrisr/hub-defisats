import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Plus, Edit, Trash2, Play, Pause, CheckCircle, BarChart3, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
import { useActiveAccountContext } from '@/hooks/useActiveAccountContext';
import { useAccountCredentials } from '@/hooks/useAccountCredentials';

// Mock data para demonstração
const mockAutomations = [
  {
    id: '1',
    name: 'Margin Guard',
    type: 'margin_guard',
    is_active: true,
    created_at: '2024-01-15',
    account_id: 'acc_1',
    account_name: 'Main Account',
    exchange_name: 'LN Markets',
    status: 'running',
    last_execution: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'TP/SL Tracker',
    type: 'tp_sl',
    is_active: false,
    created_at: '2024-01-10',
    account_id: 'acc_1',
    account_name: 'Main Account',
    exchange_name: 'LN Markets',
    status: 'paused',
    last_execution: '2024-01-10T15:45:00Z',
  },
  {
    id: '3',
    name: 'Auto Entry Bot',
    type: 'auto_entry',
    is_active: true,
    created_at: '2024-01-05',
    account_id: 'acc_2',
    account_name: 'Secondary Account',
    exchange_name: 'LN Markets',
    status: 'running',
    last_execution: '2024-01-15T09:15:00Z',
  },
];

export const Automations = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  
  // Hooks para contas
  const { accounts, loading: accountsLoading } = useUserExchangeAccounts();
  const { activeAccount } = useActiveAccountContext();
  const { 
    loading: credentialsLoading, 
    error: credentialsError,
    getActiveAccountCredentials,
    validateCredentials,
    getCacheStats
  } = useAccountCredentials();

  // Atualizar conta selecionada quando conta ativa mudar
  useEffect(() => {
    if (activeAccount) {
      setSelectedAccount(activeAccount.id);
    }
  }, [activeAccount]);

  const getFilteredAutomations = () => {
    let filtered = mockAutomations;

    // Filtrar por status
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(automation => automation.is_active === true);
        break;
      case 'inactive':
        filtered = filtered.filter(automation => automation.is_active === false);
        break;
      case 'all':
      default:
        break;
    }

    // Filtrar por conta
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(automation => automation.account_id === selectedAccount);
    }

    return filtered;
  };

  const getAccountOptions = () => {
    const options = [
      { value: 'all', label: 'Todas as Contas', icon: Users }
    ];
    
    if (accounts) {
      accounts.forEach(account => {
        options.push({
          value: account.id,
          label: `${account.account_name} (${account.exchange.name})`,
          icon: Building2
        });
      });
    }
    
    return options;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                  Automations
                </h1>
                <p className="text-text-secondary">Manage trading automations and bots</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>
        </div>

        {/* Filtros por Conta */}
        <div className="mb-6">
          <Card className="gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtrar por Conta:</span>
                </div>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAccountOptions().map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {activeAccount && (
                  <Badge variant="secondary" className="ml-2">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conta Ativa: {activeAccount.account_name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Status Card */}
        {activeAccount && (
          <div className="mb-6">
            <Card className="gradient-card-green backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Conta Ativa</h3>
                      <p className="text-muted-foreground">
                        {activeAccount.account_name} ({activeAccount.exchange.name})
                      </p>
                      {credentialsError && (
                        <p className="text-red-500 text-sm mt-1">
                          ⚠️ Erro ao validar credenciais: {credentialsError}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-500">
                      {getFilteredAutomations().filter(a => a.account_id === activeAccount.id).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Automações</div>
                    {credentialsLoading && (
                      <div className="text-xs text-muted-foreground mt-1">Validando credenciais...</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Statistics */}
        {selectedAccount !== 'all' && (
          <div className="mb-6">
            <Card className="gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {getFilteredAutomations().filter(a => a.is_active).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Ativas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {getFilteredAutomations().filter(a => !a.is_active).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Inativas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {getFilteredAutomations().filter(a => a.status === 'running').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Executando</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-500" />
                Total Automations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {mockAutomations.length}
              </div>
              <p className="text-xs text-text-secondary">
                All configured automations
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card-green backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Play className="h-4 w-4 text-green-500" />
                Active Automations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {mockAutomations.filter(a => a.is_active).length}
              </div>
              <p className="text-xs text-text-secondary">
                Currently running
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card-orange backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pause className="h-4 w-4 text-orange-500" />
                Inactive Automations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {mockAutomations.filter(a => !a.is_active).length}
              </div>
              <p className="text-xs text-text-secondary">
                Paused or stopped
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card-purple backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                95.2%
              </div>
              <p className="text-xs text-text-secondary">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Automations Table */}
        <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Automations List</CardTitle>
                <CardDescription className="text-text-secondary">
                  All configured automations and their status
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: 'active' | 'inactive' | 'all') => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Active ({mockAutomations.filter(a => a.is_active).length})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  Inactive ({mockAutomations.filter(a => !a.is_active).length})
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  All ({mockAutomations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-6">
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-text-primary font-semibold">Name</TableHead>
                        <TableHead className="text-text-primary font-semibold">Type</TableHead>
                        <TableHead className="text-text-primary font-semibold">Account</TableHead>
                        <TableHead className="text-text-primary font-semibold">Status</TableHead>
                        <TableHead className="text-text-primary font-semibold">Last Execution</TableHead>
                        <TableHead className="text-text-primary font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAutomations().map((automation, index) => {
                        const isActiveAccount = activeAccount && automation.account_id === activeAccount.id;
                        return (
                          <TableRow 
                            key={automation.id}
                            className={cn(
                              "border-border/50 hover:bg-card/50 transition-colors",
                              index % 2 === 0 ? "bg-card/20" : "bg-card/10",
                              isActiveAccount && "ring-2 ring-green-500/20 bg-green-500/5"
                            )}
                          >
                          <TableCell className="font-medium text-text-primary">
                            {automation.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                              {automation.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isActiveAccount ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                  {automation.account_name}
                                  {isActiveAccount && (
                                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600 border-green-500/30">
                                      Ativa
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{automation.exchange_name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "border-green-500/30",
                                  automation.is_active 
                                    ? "bg-green-500/20 text-green-400" 
                                    : "bg-red-500/20 text-red-400"
                                )}
                              >
                                {automation.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {isActiveAccount && (
                                <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  {automation.status}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {automation.last_execution 
                              ? new Date(automation.last_execution).toLocaleString()
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "transition-all duration-200",
                                  automation.is_active 
                                    ? "hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30" 
                                    : "hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30"
                                )}
                              >
                                {automation.is_active ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};