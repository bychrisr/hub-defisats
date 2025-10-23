import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, RefreshCw, CheckCircle, AlertCircle, Edit3, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import '@/styles/verify-email-improvements.css';

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
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Cooldown do resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Funções para OTP acessível
  const handleOtpDigitChange = (index: number, value: string) => {
    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, '').slice(0, 1);
    setOtpDigits(newDigits);
    
    // Auto-avanço
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit quando completar
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      setOtpCode(fullCode);
      setTimeout(() => handleOtpSubmit(new Event('submit') as any), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtpDigits(newDigits);
    setOtpCode(pastedData);
    
    // Focus no último dígito preenchido
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    otpRefs.current[lastFilledIndex]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (!code || code.length !== 6) {
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

    if (resendCooldown > 0) {
      return; // Não permitir reenvio durante cooldown
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
        setResendCooldown(45); // 45 segundos de cooldown
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

  const handleChangeEmail = () => {
    setShowChangeEmail(true);
  };

  const handleSaveNewEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, digite um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setEmail(newEmail);
    setShowChangeEmail(false);
    setNewEmail('');
    toast({
      title: 'Email alterado',
      description: 'Agora você pode reenviar o código para o novo email.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Verifique seu email</CardTitle>
          <CardDescription className="text-slate-300">
            Enviamos um código de verificação para{' '}
            <span className="text-blue-400 font-medium">{email}</span>
            {!showChangeEmail && (
              <button
                onClick={handleChangeEmail}
                className="ml-2 text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 rounded px-1"
                aria-label="Alterar email"
              >
                <Edit3 className="h-4 w-4 inline" />
              </button>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status do email */}
          {status && (
            <Alert className={status.email_verified 
              ? 'border-green-500/30 bg-green-900/20 text-green-200' 
              : 'border-blue-500/30 bg-blue-900/20 text-blue-200'
            }>
              {status.email_verified ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-400" />
              )}
              <AlertDescription>
                {status.email_verified 
                  ? 'Email verificado com sucesso!'
                  : 'Aguardando verificação do email...'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Instruções simplificadas */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-200">Como verificar:</h3>
            <div className="text-sm text-slate-400 space-y-2">
              <p>1. Abra sua caixa de entrada</p>
              <p>2. Digite o código de 6 dígitos abaixo</p>
            </div>
            
            {/* Atalhos para provedores */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="verify-email-provider-btn"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Gmail
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://outlook.live.com', '_blank')}
                className="verify-email-provider-btn"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Outlook
              </Button>
            </div>
          </div>

          {/* Formulário OTP Acessível */}
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-2 text-slate-200">
                Código de verificação (6 dígitos)
              </label>
              <div 
                className="verify-email-otp-container"
                onPaste={handleOtpPaste}
                role="group"
                aria-label="Código de verificação de 6 dígitos"
              >
                {otpDigits.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="verify-email-otp-input"
                    aria-label={`Dígito ${index + 1} de 6`}
                    maxLength={1}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Digite os 6 dígitos. O código expira em 10 minutos.
              </p>
            </div>

            <Button 
              type="submit" 
              className="verify-email-cta-button w-full" 
              disabled={isChecking || otpDigits.join('').length !== 6}
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

          {/* Botão reenviar com cooldown */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="verify-email-resend-button w-full"
              aria-live="polite"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reenviar em {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reenviar email
                </>
              )}
            </Button>
          </div>

          {/* Modal para alterar email */}
          {showChangeEmail && (
            <div className="verify-email-change-modal">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-200">Alterar email</h4>
                <Input
                  type="email"
                  placeholder="Digite o novo email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveNewEmail}
                    className="verify-email-cta-button flex-1"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowChangeEmail(false)}
                    className="verify-email-resend-button flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Link para voltar */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="verify-email-back-button text-sm"
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
