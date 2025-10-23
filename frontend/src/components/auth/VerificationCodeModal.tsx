import { useState, useEffect } from 'react';
import { X, Mail, Clock, RefreshCw } from 'lucide-react';

interface VerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
}

export function VerificationCodeModal({
  isOpen,
  onClose,
  onSubmit,
  onResend,
  email,
}: VerificationCodeModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);

  // Timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Auto-submit quando todos os dígitos forem preenchidos
  useEffect(() => {
    if (code.every(digit => digit !== '')) {
      handleSubmit();
    }
  }, [code]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus próximo input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);

    // Focus último dígito preenchido
    const lastFilledIndex = pastedData.length - 1;
    if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
      const input = document.getElementById(`code-${lastFilledIndex}`);
      input?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Por favor, digite todos os 6 dígitos');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(fullCode);
    } catch (err: any) {
      setError(err.message || 'Código inválido. Tente novamente.');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onResend();
      setTimeLeft(300);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Verificação de Segurança
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descrição */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
            Enviamos um código de 6 dígitos para:
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {email}
          </p>
        </div>

        {/* Input de Código */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Digite o código de verificação
          </label>
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isSubmitting}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>
            {timeLeft > 0 ? (
              <>Expira em <strong>{formatTime(timeLeft)}</strong></>
            ) : (
              <span className="text-red-600">Código expirado</span>
            )}
          </span>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Botão Reenviar */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Não recebeu o código?
          </p>
          <button
            onClick={handleResend}
            disabled={!canResend || isSubmitting}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            {canResend ? 'Reenviar código' : `Aguarde ${formatTime(timeLeft)}`}
          </button>
        </div>

        {/* Info de Segurança */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong className="text-blue-600 dark:text-blue-400">🔒 Segurança:</strong>
            <br />
            Nunca compartilhe este código. Nossa equipe nunca solicitará este código por telefone ou email.
          </p>
        </div>
      </div>
    </div>
  );
}


