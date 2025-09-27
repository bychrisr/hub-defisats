import React, { useEffect } from 'react';

/**
 * Componente que verifica se o usuário está na porta errada e redireciona automaticamente
 * para a porta correta do frontend (13000)
 */
export const PortRedirect: React.FC = () => {
  useEffect(() => {
    // Verificar se está na porta errada
    if (typeof window !== 'undefined' && (window.location.port === '13010' || window.location.host === 'localhost:13010')) {
      console.log('⚠️ PORT REDIRECT - Detectado acesso direto ao backend (porta 13010), redirecionando para frontend...');
      console.log('⚠️ PORT REDIRECT - URL atual:', window.location.href);
      
      // Redirecionar para a porta correta
      const newUrl = window.location.href.replace(':13010', ':13000');
      console.log('⚠️ PORT REDIRECT - Redirecionando para:', newUrl);
      
      // Usar replace para não adicionar ao histórico
      window.location.replace(newUrl);
    }
  }, []);

  // Se está na porta errada, mostrar mensagem de redirecionamento
  if (typeof window !== 'undefined' && (window.location.port === '13010' || window.location.host === 'localhost:13010')) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>Redirecionando para Frontend...</h1>
        <p>Você será redirecionado automaticamente para a porta correta.</p>
        <div style={{ marginTop: '20px' }}>
          <a 
            href={window.location.href.replace(':13010', ':13000')}
            style={{ 
              color: '#3b82f6', 
              textDecoration: 'none',
              padding: '10px 20px',
              border: '1px solid #3b82f6',
              borderRadius: '5px'
            }}
          >
            Clique aqui se não for redirecionado automaticamente
          </a>
        </div>
      </div>
    );
  }

  // Se está na porta correta, não renderizar nada
  return null;
};

export default PortRedirect;
