import React, { useState } from 'react';
import { useUpdateNotification } from '../contexts/VersionContext';

interface UpdateNotificationProps {
  className?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ className = '' }) => {
  const { shouldShowNotification, versionInfo, handleNotificationShown } = useUpdateNotification();
  const [isVisible, setIsVisible] = useState(shouldShowNotification);
  const [isUpdating, setIsUpdating] = useState(false);

  // Se não deve mostrar a notificação, não renderiza nada
  if (!shouldShowNotification || !isVisible) {
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      console.log('🔄 UPDATE NOTIFICATION - Reloading page for update...');
      
      // Marca como notificado antes de recarregar
      handleNotificationShown();
      
      // Recarrega a página para aplicar a atualização
      window.location.reload();
    } catch (error) {
      console.error('❌ UPDATE NOTIFICATION - Error during update:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    console.log('❌ UPDATE NOTIFICATION - User dismissed update notification');
    handleNotificationShown();
    setIsVisible(false);
  };

  const handleLater = () => {
    console.log('⏰ UPDATE NOTIFICATION - User chose to update later');
    setIsVisible(false);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-blue-600 dark:text-blue-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nova Versão Disponível
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uma atualização foi encontrada
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Uma nova versão da aplicação está disponível. Para aproveitar as melhorias e correções mais recentes, 
            recomendamos que você atualize agora.
          </p>
          
          {versionInfo && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Versão Atual:</span>
                  <p className="text-gray-900 dark:text-white font-mono">
                    v{versionInfo.currentVersion}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Nova Versão:</span>
                  <p className="text-green-600 dark:text-green-400 font-mono font-semibold">
                    v{versionInfo.latestVersion}
                  </p>
                </div>
              </div>
              
              {versionInfo.buildTime && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Build:</span> {new Date(versionInfo.buildTime).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          )}

          {/* Features */}
          {versionInfo?.features && versionInfo.features.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Novidades nesta versão:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {versionInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg 
                      className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    {feature.charAt(0).toUpperCase() + feature.slice(1)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isUpdating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Atualizando...
              </>
            ) : (
              'Atualizar Agora'
            )}
          </button>
          
          <button
            onClick={handleLater}
            disabled={isUpdating}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
          >
            Mais Tarde
          </button>
          
          <button
            onClick={handleDismiss}
            disabled={isUpdating}
            className="px-4 py-2 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Warning */}
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              A atualização recarregará a página automaticamente. Certifique-se de salvar seu trabalho antes de continuar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
