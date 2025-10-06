import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, AlertCircle, Bot } from 'lucide-react';
import { useAutomationContext } from '@/contexts/AutomationContext';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
import { useAccountCredentials } from '@/hooks/useAccountCredentials';

const automationFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  type: z.enum(['margin_guard', 'tp_sl', 'auto_entry'], {
    required_error: 'Tipo de automação é obrigatório',
  }),
  user_exchange_account_id: z.string().min(1, 'Conta é obrigatória'),
  config: z.object({
    enabled: z.boolean().default(true),
    risk_level: z.enum(['low', 'medium', 'high']).default('medium'),
    amount: z.number().min(0.001, 'Valor deve ser maior que 0'),
    // Configurações específicas por tipo
    margin_threshold: z.number().optional(),
    tp_percentage: z.number().optional(),
    sl_percentage: z.number().optional(),
    entry_conditions: z.array(z.string()).optional(),
  }),
});

type AutomationFormData = z.infer<typeof automationFormSchema>;

interface AutomationFormProps {
  automation?: any;
  onSuccess?: (automation: any) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const AutomationForm: React.FC<AutomationFormProps> = ({
  automation,
  onSuccess,
  onCancel,
  isEditing = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Contextos e hooks
  const { createAutomation, updateAutomation, activeAccount, hasActiveAccount } = useAutomationContext();
  const { accounts, loading: accountsLoading } = useUserExchangeAccounts();
  const { validateCredentials } = useAccountCredentials();

  // Formulário
  const form = useForm<AutomationFormData>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: {
      name: automation?.name || '',
      type: automation?.type || 'margin_guard',
      user_exchange_account_id: automation?.user_exchange_account_id || activeAccount?.id || '',
      config: {
        enabled: automation?.config?.enabled ?? true,
        risk_level: automation?.config?.risk_level || 'medium',
        amount: automation?.config?.amount || 0.001,
        margin_threshold: automation?.config?.margin_threshold || 0.8,
        tp_percentage: automation?.config?.tp_percentage || 5,
        sl_percentage: automation?.config?.sl_percentage || 3,
        entry_conditions: automation?.config?.entry_conditions || [],
      },
    },
  });

  const selectedAccountId = form.watch('user_exchange_account_id');
  const selectedType = form.watch('type');

  // Atualizar conta quando conta ativa mudar
  useEffect(() => {
    if (activeAccount && !isEditing) {
      form.setValue('user_exchange_account_id', activeAccount.id);
    }
  }, [activeAccount, isEditing, form]);

  // Validar credenciais da conta selecionada
  useEffect(() => {
    if (selectedAccountId) {
      validateCredentials(selectedAccountId);
    }
  }, [selectedAccountId, validateCredentials]);

  // Obter conta selecionada
  const selectedAccount = accounts?.find(acc => acc.id === selectedAccountId);

  // Obter opções de contas
  const accountOptions = accounts?.map(account => ({
    value: account.id,
    label: `${account.account_name} (${account.exchange.name})`,
    isActive: account.is_active,
    hasCredentials: true, // TODO: Verificar se tem credenciais válidas
  })) || [];

  // Configurações específicas por tipo
  const getTypeSpecificConfig = (type: string) => {
    switch (type) {
      case 'margin_guard':
        return {
          margin_threshold: form.getValues('config.margin_threshold') || 0.8,
        };
      case 'tp_sl':
        return {
          tp_percentage: form.getValues('config.tp_percentage') || 5,
          sl_percentage: form.getValues('config.sl_percentage') || 3,
        };
      case 'auto_entry':
        return {
          entry_conditions: form.getValues('config.entry_conditions') || [],
        };
      default:
        return {};
    }
  };

  // Submeter formulário
  const onSubmit = async (data: AutomationFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      console.log('🔍 AUTOMATION FORM - Submitting form...', data);

      // Validar se a conta tem credenciais
      if (!selectedAccount) {
        throw new Error('Conta não encontrada');
      }

      if (!selectedAccount.is_active) {
        throw new Error('Não é possível criar automação para conta inativa');
      }

      // Preparar dados da automação
      const automationData = {
        name: data.name,
        type: data.type,
        user_exchange_account_id: data.user_exchange_account_id,
        config: {
          ...data.config,
          ...getTypeSpecificConfig(data.type),
        },
      };

      let result;
      if (isEditing && automation) {
        result = await updateAutomation(automation.id, automationData);
      } else {
        result = await createAutomation(automationData);
      }

      console.log('✅ AUTOMATION FORM - Form submitted successfully:', result);

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar automação';
      console.error('❌ AUTOMATION FORM - Error submitting form:', errorMessage);
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {isEditing ? 'Editar Automação' : 'Nova Automação'}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Atualize as configurações da automação'
            : 'Configure uma nova automação para sua conta'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome da Automação */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Automação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Margin Guard Principal" {...field} />
                  </FormControl>
                  <FormDescription>
                    Escolha um nome descritivo para identificar esta automação
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Automação */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Automação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="margin_guard">Margin Guard</SelectItem>
                      <SelectItem value="tp_sl">Take Profit / Stop Loss</SelectItem>
                      <SelectItem value="auto_entry">Entrada Automática</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o tipo de automação que deseja configurar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Conta */}
            <FormField
              control={form.control}
              name="user_exchange_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta de Exchange</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{option.label}</span>
                            {option.isActive && (
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
                  <FormDescription>
                    Selecione a conta de exchange para esta automação
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status da Conta Selecionada */}
            {selectedAccount && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedAccount.account_name}</span>
                  {selectedAccount.is_active ? (
                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inativa
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedAccount.exchange.name} • {selectedAccount.exchange.name}
                </p>
              </div>
            )}

            {/* Configurações Básicas */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="config.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar Automação</FormLabel>
                      <FormDescription>
                        A automação será executada automaticamente quando ativada
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.risk_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Risco</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível de risco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define o nível de risco para esta automação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (BTC)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="0.001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor em BTC para esta automação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Configurações Específicas por Tipo */}
            {selectedType === 'margin_guard' && (
              <FormField
                control={form.control}
                name="config.margin_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Margem (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="1"
                        placeholder="0.8"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentual mínimo de margem antes de fechar posições
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === 'tp_sl' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="config.tp_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Take Profit (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.sl_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Loss (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="3"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Erro de Submissão */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Erro ao salvar automação</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{submitError}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !hasActiveAccount}
                className="flex-1"
              >
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
