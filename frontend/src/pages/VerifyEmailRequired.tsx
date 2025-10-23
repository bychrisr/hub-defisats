import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationStatus {
  email_verified: boolean;
  account_status: string;
}

export default function VerifyEmailRequired() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Obter email do state da navegação
  useEffect(() => {
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    }
  }, [location.state]);

  // Polling automático para verificar status
  useEffect(() => {
    if (!email) return;

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/auth/verification-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data);

          if (data.email_verified) {
            // Email verificado, redirecionar para login
            toast({
              title: 'Email verificado!',
              description: 'Redirecionando para o login...',
            });
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    // Verificar imediatamente
    checkStatus();

    // Configurar polling a cada 10 segundos
    const interval = setInterval(checkStatus, 10000);
    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [email, navigate, toast]);

  // Limpar polling ao sair da página
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Por favor, digite um código de 6 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch('/api/auth/verify-email/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        // Salvar JWT e redirecionar
        localStorage.setItem('access_token', data.jwt);
        toast({
          title: 'Email verificado!',
          description: 'Redirecionando para o dashboard...',
        });
        navigate('/dashboard?first=true');
      } else {
        toast({
          title: 'Código inválido',
          description: 'Verifique o código e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao verificar o código.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: 'Email necessário',
        description: 'Por favor, forneça um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Email reenviado!',
          description: 'Verifique sua caixa de entrada.',
        });
      } else {
        toast({
          title: 'Erro ao reenviar',
          description: data.message || 'Tente novamente em alguns minutos.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao reenviar o email.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verifique seu email</CardTitle>
          <CardDescription>
            Enviamos um link de verificação para <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status do email */}
          {status && (
            <Alert className={status.email_verified ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
              {status.email_verified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription>
                {status.email_verified 
                  ? 'Email verificado com sucesso!'
                  : 'Aguardando verificação do email...'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Instruções */}
          <div className="space-y-3">
            <h3 className="font-medium">Como verificar:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Abra sua caixa de entrada</li>
              <li>Procure por um email da Axisor</li>
              <li>Clique no link de verificação</li>
              <li>Ou use o código abaixo</li>
            </ol>
          </div>

          {/* Formulário OTP */}
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-2">
                Código de verificação (6 dígitos)
              </label>
              <Input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isChecking || otpCode.length !== 6}
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar código'
              )}
            </Button>
          </form>

          {/* Botão reenviar */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reenviar email
                </>
              )}
            </Button>
          </div>

          {/* Link para voltar */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
