import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Key, 
  Bell, 
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Upload,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";

export const Settings = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil, API keys e preferências de notificação
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/avatars/01.png" />
                  <AvatarFallback className="text-lg">JS</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Alterar Foto
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG até 2MB
                  </p>
                </div>
              </div>

              <Separator />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      defaultValue="João"
                      {...register("firstName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      defaultValue="Silva"
                      {...register("lastName")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="joao@example.com"
                    {...register("email")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <select
                    id="timezone"
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    {...register("timezone")}
                  >
                    <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                    <option value="UTC">UTC (UTC+0)</option>
                    <option value="America/New_York">Nova York (UTC-5)</option>
                  </select>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Configuração LN Markets
                  </CardTitle>
                  <CardDescription>
                    Configure suas credenciais para conectar com a LN Markets
                  </CardDescription>
                </div>
                <Badge 
                  className={isConnected ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"}
                >
                  {isConnected ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Desconectado
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Segurança</p>
                    <p className="text-sm text-muted-foreground">
                      Suas API keys são criptografadas e armazenadas com segurança. 
                      Nunca compartilhamos suas credenciais com terceiros.
                    </p>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente</Label>
                  <select
                    id="environment"
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="testnet">Testnet (Recomendado para testes)</option>
                    <option value="mainnet">Mainnet (Produção)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Sua API Key da LN Markets"
                      defaultValue={isConnected ? "lnm_test_•••••••••••••••••••••••••••••••••••••••••••••••••••" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="secretKey"
                      type={showSecretKey ? "text" : "password"}
                      placeholder="Sua Secret Key da LN Markets"
                      defaultValue={isConnected ? "•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline">
                    Testar Conexão
                  </Button>
                  <Button type="submit">
                    Salvar Credenciais
                  </Button>
                </div>
              </form>

              {isConnected && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <h4 className="font-medium text-success mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Conexão Ativa
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>Última sincronização: há 30 segundos</p>
                    <p>Permissões: Trading, Leitura de posições</p>
                    <p>Rate Limit: 120 requests/min</p>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">📖 <strong>Como obter suas API Keys:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Acesse sua conta na LN Markets</li>
                  <li>Vá para Configurações → API</li>
                  <li>Clique em "Create New API Key"</li>
                  <li>Ative as permissões de Trading e Reading</li>
                  <li>Copie e cole suas credenciais aqui</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências de Notificação
              </CardTitle>
              <CardDescription>
                Configure como e quando você quer receber alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas de Margem</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando margem atingir limites críticos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Execução de Trades</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando automações executarem trades
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Erros de Sistema</p>
                    <p className="text-sm text-muted-foreground">
                      Alertas sobre problemas de conectividade ou erros
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Relatórios Diários</p>
                    <p className="text-sm text-muted-foreground">
                      Resumo diário de atividades por email
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Novidades e Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Novos recursos e atualizações do sistema
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Canais de Notificação</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="email" defaultChecked className="w-4 h-4" />
                    <Label htmlFor="email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="push" defaultChecked className="w-4 h-4" />
                    <Label htmlFor="push">Notificações Push</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="telegram" className="w-4 h-4" />
                    <Label htmlFor="telegram">Telegram Bot (Em breve)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="webhook" className="w-4 h-4" />
                    <Label htmlFor="webhook">Webhook Personalizado</Label>
                  </div>
                </div>
              </div>

              <Button>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Gerencie sua senha e configurações de segurança da conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Alterar Senha</h4>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Alterar Senha</Button>
                </form>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Opções de Segurança</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação de Dois Fatores</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma camada extra de segurança
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar 2FA
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Logout Automático</p>
                    <p className="text-sm text-muted-foreground">
                      Desconectar após períodos de inatividade
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-destructive">Zona de Perigo</h4>
                
                <div className="p-4 border border-destructive/20 rounded-lg space-y-4">
                  <div>
                    <p className="font-medium">Excluir Conta</p>
                    <p className="text-sm text-muted-foreground">
                      Remover permanentemente sua conta e todos os dados
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};