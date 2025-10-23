import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import axios from 'axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Verificar se veio de redirect (URL params)
      const statusParam = searchParams.get('status');
      const messageParam = searchParams.get('message');
      const emailParam = searchParams.get('email');
      const tokenParam = searchParams.get('token');

      if (statusParam) {
        // Redirect do backend
        if (statusParam === 'success') {
          setStatus('success');
          setEmail(emailParam || '');
          setMessage('Email verificado com sucesso!');
        } else {
          setStatus('error');
          setMessage(
            messageParam === 'invalid_token' 
              ? 'Token de verificação inválido ou expirado'
              : 'Erro ao verificar email'
          );
        }
        return;
      }

      if (!tokenParam) {
        setStatus('error');
        setMessage('Token de verificação não fornecido');
        return;
      }

      // Verificar token via API
      try {
        const response = await axios.post('/api/auth/verify-email', {
          token: tokenParam,
        });

        if (response.data.success) {
          setStatus('success');
          setEmail(response.data.email || '');
          setMessage('Email verificado com sucesso!');
        } else {
          setStatus('error');
          setMessage('Token de verificação inválido ou expirado');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Erro ao verificar email. Por favor, tente novamente.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/login', {
        state: {
          message: 'Email verified! You can now log in to your account.',
          email,
        },
      });
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            {status === 'loading' && 'Verificando Email...'}
            {status === 'success' && 'Email Verificado!'}
            {status === 'error' && 'Verificação Falhou'}
          </h1>

          {/* Message */}
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>

          {email && status === 'success' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Continuar para Login
              </Button>
            )}
            
            {status === 'error' && (
              <>
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  className="w-full"
                >
                  Voltar para Registro
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  className="w-full"
                >
                  Ir para Login
                </Button>
              </>
            )}
          </div>

          {/* Help Text */}
          {status === 'error' && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Precisa de ajuda?</strong>
                <br />
                Se você não recebeu o email de verificação, verifique sua caixa de spam ou tente fazer um novo registro.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


