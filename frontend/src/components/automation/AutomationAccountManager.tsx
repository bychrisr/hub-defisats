import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';
import { useAutomationContext } from '@/contexts/AutomationContext';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
import { AutomationForm } from '@/components/forms/AutomationForm';
import { cn } from '@/lib/utils';

interface AutomationAccountManagerProps {
  className?: string;
}

export const AutomationAccountManager: React.FC<AutomationAccountManagerProps> = ({ 
  className 
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  // Contextos e hooks
  const {
    automations,
    activeAccountAutomations,
    stats,
    isLoading,
    error,
    hasActiveAccount,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    refreshAutomations,
    filterByAccount,
    clearFilters,
    filteredAutomations,
    getAccountStats,
  } = useAutomationContext();

  const { accounts, loading: accountsLoading } = useUserExchangeAccounts();

  // Atualizar conta selecionada quando conta ativa mudar
  useEffect(() => {
    if (hasActiveAccount) {
      setSelectedAccountId(null); // Usar conta ativa por padrão
    }
  }, [hasActiveAccount]);

  // Obter automações filtradas
  const getFilteredAutomations = () => {
    let filtered = selectedAccountId 
      ? automations.filter(a => a.user_exchange_account_id === selectedAccountId)
      : activeAccountAutomations;

    switch (activeTab) {
      case 'active':
        return filtered.filter(a => a.is_active);
      case 'inactive':
        return filtered.filter(a => !a.is_active);
      default:
        return filtered;
    }
  };

  // Obter estatísticas da conta selecionada
  const getCurrentAccountStats = () => {
    if (selectedAccountId) {
      return getAccountStats(selectedAccountId);
    }
    return {
      total: activeAccountAutomations.length,
      active: activeAccountAutomations.filter(a => a.is_active).length,
      inactive: activeAccountAutomations.filter(a => !a.is_active).length,
    };
  };

  // Obter conta selecionada
  const selectedAccount = selectedAccountId 
    ? accounts?.find(acc => acc.id === selectedAccountId)
    : null;

  // Handlers
  const handleAccountChange = (accountId: string) => {
    if (accountId === 'all') {
      setSelectedAccountId(null);
      clearFilters();
    } else {
      setSelectedAccountId(accountId);
      filterByAccount(accountId);
    }
  };

  const handleCreateAutomation = async (data: any) => {
    try {
      await createAutomation(data);
      setShowCreateForm(false);
      await refreshAutomations();
    } catch (error) {
      console.error('Error creating automation:', error);
    }
  };

  const handleUpdateAutomation = async (data: any) => {
    try {
      await updateAutomation(editingAutomation.id, data);
      setEditingAutomation(null);
      await refreshAutomations();
    } catch (error) {
      console.error('Error updating automation:', error);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta automação?')) {
      try {
        await deleteAutomation(id);
        await refreshAutomations();
      } catch (error) {
        console.error('Error deleting automation:', error);
      }
    }
  };

  const handleToggleAutomation = async (id: string) => {
    try {
      await toggleAutomation(id);
      await refreshAutomations();
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const currentStats = getCurrentAccountStats();
  const filteredAutomations = getFilteredAutomations();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header com Seletor de Conta */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Gerenciador de Automações
              </CardTitle>
              <CardDescription>
                Gerencie automações por conta de exchange
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por Conta:</span>
            </div>
            <Select 
              value={selectedAccountId || 'all'} 
              onValueChange={handleAccountChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Todas as Contas</span>
                  </div>
                </SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{account.account_name} ({account.exchange.name})</span>
                      {account.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                {selectedAccount.account_name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{currentStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-500">{currentStats.active}</div>
                <div className="text-sm text-muted-foreground">Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-500">{currentStats.inactive}</div>
                <div className="text-sm text-muted-foreground">Inativas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-500">
                  {filteredAutomations.filter(a => a.status === 'running').length}
                </div>
                <div className="text-sm text-muted-foreground">Executando</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Status */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Todas ({filteredAutomations.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Ativas ({currentStats.active})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Inativas ({currentStats.inactive})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="p-6">
              {/* Tabela de Automações */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Execução</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAutomations.map((automation) => {
                      const account = accounts?.find(acc => acc.id === automation.user_exchange_account_id);
                      return (
                        <TableRow key={automation.id}>
                          <TableCell className="font-medium">
                            {automation.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {automation.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium text-sm">
                                  {account?.account_name || 'Conta não encontrada'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {account?.exchange.name || 'Exchange não encontrada'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={automation.is_active ? "default" : "secondary"}
                                className={cn(
                                  automation.is_active 
                                    ? "bg-green-500/20 text-green-600" 
                                    : "bg-gray-500/20 text-gray-600"
                                )}
                              >
                                {automation.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                              {automation.status && (
                                <Badge variant="outline" className="text-xs">
                                  {automation.status}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {automation.last_execution 
                              ? new Date(automation.last_execution).toLocaleString()
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAutomation(automation.id)}
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
                                onClick={() => setEditingAutomation(automation)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAutomation(automation.id)}
                                className="text-red-600 hover:text-red-700"
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

      {/* Modais */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <AutomationForm
              onSuccess={handleCreateAutomation}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {editingAutomation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <AutomationForm
              automation={editingAutomation}
              isEditing={true}
              onSuccess={handleUpdateAutomation}
              onCancel={() => setEditingAutomation(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
