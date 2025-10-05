import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// import '../styles/block-password-managers.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Key, 
  Shield, 
  TestTube,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Exchange, UserExchangeCredentials } from '@/services/exchange.service';

interface ExchangeCredentialsFormProps {
  exchange: Exchange;
  existingCredentials?: UserExchangeCredentials | null;
  onSave: (credentials: Record<string, string>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onTest?: () => Promise<{ success: boolean; message: string }>;
  isLoading?: boolean;
}

const createSchema = (credentialTypes: Exchange['credential_types']) => {
  const schemaFields: Record<string, z.ZodString> = {};
  
  credentialTypes.forEach(type => {
    if (type.is_required) {
      schemaFields[type.field_name] = z.string().min(1, `${type.name} is required`);
    } else {
      schemaFields[type.field_name] = z.string().optional();
    }
  });
  
  return z.object(schemaFields);
};

export function ExchangeCredentialsForm({
  exchange,
  existingCredentials,
  onSave,
  onDelete,
  onTest,
  isLoading = false
}: ExchangeCredentialsFormProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Gerar nomes aleatórios para confundir o navegador
  const [randomSuffix] = useState(() => Math.random().toString(36).substring(2, 15));

  // Proteção simples contra gerenciadores de senhas
  useEffect(() => {
    // Apenas remove ícones de gerenciadores se existirem
    const removePasswordManagerIcons = () => {
      const lastpassIcons = document.querySelectorAll('[data-lastpass-icon]');
      lastpassIcons.forEach(icon => icon.remove());
    };
    
    removePasswordManagerIcons();
  }, []);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const schema = createSchema(exchange.credential_types);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existingCredentials?.credentials || {}
  });

  const watchedFields = watch();

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const onSubmit = async (data: FormData) => {
    try {
      console.log('🔄 EXCHANGE CREDENTIALS FORM - Saving credentials for:', exchange.name);
      console.log('📝 EXCHANGE CREDENTIALS FORM - Form data:', data);
      
      setIsSaving(true);
      setTestResult(null);
      
      await onSave(data);
      
      console.log('✅ EXCHANGE CREDENTIALS FORM - Credentials saved successfully');
      
      // Show success feedback
      setTestResult({
        success: true,
        message: 'Credentials updated successfully!'
      });
      
      // Show toast notification
      toast({
        title: "✅ Success",
        description: "Credentials updated successfully!",
        duration: 3000,
        className: "border-[#0ECB81] bg-[#0ECB81]/10 text-[#0ECB81]",
      });
      
    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS FORM - Error saving credentials:', error);
      
      // Show error feedback
      setTestResult({
        success: false,
        message: error.message || 'Failed to save credentials'
      });
      
      // Show error toast
      toast({
        title: "❌ Error",
        description: error.message || 'Failed to save credentials',
        variant: "destructive",
        duration: 5000,
        className: "border-[#F6465D] bg-[#F6465D]/10 text-[#F6465D]",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    try {
      setIsTesting(true);
      setTestResult(null);
      
      const result = await onTest();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
      reset();
      setTestResult(null);
    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS FORM - Error deleting credentials:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasAllRequiredFields = exchange.credential_types
    .filter(type => type.is_required)
    .every(type => watchedFields[type.field_name] && watchedFields[type.field_name].length > 0);

  // Debug: Log form state
  console.log('🔍 EXCHANGE CREDENTIALS FORM - Form state:', {
    exchangeName: exchange.name,
    hasAllRequiredFields,
    isLoading,
    watchedFields,
    requiredFields: exchange.credential_types.filter(type => type.is_required).map(type => ({
      field: type.field_name,
      value: watchedFields[type.field_name],
      hasValue: !!(watchedFields[type.field_name] && watchedFields[type.field_name].length > 0)
    }))
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {exchange.name}
                {existingCredentials?.is_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {exchange.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingCredentials && (
              <Badge variant={existingCredentials.is_active ? "default" : "secondary"}>
                {existingCredentials.is_active ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-4"
          autoComplete="off"
        >
          {/* Múltiplas estratégias para bloquear autocomplete - baseado em pesquisas 2024 */}
          <input
            type="text"
            name="fakeusernameremembered"
            autoComplete="username"
            style={{ display: 'none' }}
            tabIndex={-1}
          />
          <input
            type="password"
            name="fakepasswordremembered"
            autoComplete="new-password"
            style={{ display: 'none' }}
            tabIndex={-1}
          />
          <input
            type="password"
            name="fake_current_password"
            autoComplete="current-password"
            style={{ display: 'none' }}
            tabIndex={-1}
          />
          <input
            type="text"
            name="fake_username"
            autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
            tabIndex={-1}
            readOnly
          />
          <input
            type="password"
            name="fake_password"
            autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
            tabIndex={-1}
            readOnly
          />
          {exchange.credential_types
            .sort((a, b) => a.order - b.order)
            .map((credentialType) => (
              <div key={credentialType.id} className="space-y-2">
                <Label htmlFor={credentialType.field_name} className="flex items-center gap-2">
                  {credentialType.name}
                  {credentialType.is_required && (
                    <span className="text-red-500">*</span>
                  )}
                  {credentialType.description && (
                    <span className="text-sm text-muted-foreground">
                      - {credentialType.description}
                    </span>
                  )}
                </Label>
                
                <div className="relative">
                  <Input
                    id={`${credentialType.field_name}_${randomSuffix}`}
                    name={`credential_${credentialType.field_name}_${randomSuffix}`}
                    type={
                      credentialType.field_type === 'password' 
                        ? (showPasswords[credentialType.field_name] ? 'text' : 'password')
                        : credentialType.field_type
                    }
                    placeholder={`Enter your ${credentialType.name.toLowerCase()}`}
                    autoComplete={credentialType.field_type === 'password' ? 'new-password' : 'off'}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-dashlane-ignore="true"
                    data-keeper-ignore="true"
                    data-nordpass-ignore="true"
                    data-roboform-ignore="true"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    onMouseEnter={(e) => e.target.removeAttribute('readonly')}
                    {...register(credentialType.field_name)}
                    className={errors[credentialType.field_name] ? 'border-red-500' : ''}
                  />
                  
                  {credentialType.field_type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility(credentialType.field_name)}
                    >
                      {showPasswords[credentialType.field_name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                
                {errors[credentialType.field_name] && (
                  <p className="text-sm text-red-500">
                    {errors[credentialType.field_name]?.message}
                  </p>
                )}
              </div>
            ))}

          <Separator />

          {/* Test Result */}
          {testResult && (
            <Alert className={testResult.success ? 'border-[#0ECB81] bg-[#0ECB81]/10' : 'border-[#F6465D] bg-[#F6465D]/10'}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-[#0ECB81]" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#F6465D]" />
                )}
                <AlertDescription className={testResult.success ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
                  {testResult.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSaving || !hasAllRequiredFields}
              className={`flex items-center gap-2 transition-all duration-200 ${
                isSaving 
                  ? 'opacity-75 cursor-not-allowed bg-[#3773F5]/70' 
                  : hasAllRequiredFields 
                    ? 'bg-[#3773F5] hover:bg-[#3773F5]/90 hover:shadow-lg hover:shadow-[#3773F5]/25' 
                    : 'opacity-50 cursor-not-allowed bg-gray-400'
              }`}
              title={!hasAllRequiredFields ? 'Please fill all required fields' : isSaving ? 'Saving...' : 'Click to save credentials'}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{existingCredentials ? 'Update Credentials' : 'Save Credentials'}</span>
                </>
              )}
              {!hasAllRequiredFields && !isSaving && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Fill required fields)
                </span>
              )}
            </Button>

            {onTest && hasAllRequiredFields && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || isSaving}
                className="flex items-center gap-2 border-[#3773F5] text-[#3773F5] hover:bg-[#3773F5] hover:text-white hover:shadow-lg hover:shadow-[#3773F5]/25 transition-all duration-200"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                Test Connection
              </Button>
            )}

            {existingCredentials && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-2 bg-[#F6465D] hover:bg-[#F6465D]/90 hover:shadow-lg hover:shadow-[#F6465D]/25 transition-all duration-200"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
