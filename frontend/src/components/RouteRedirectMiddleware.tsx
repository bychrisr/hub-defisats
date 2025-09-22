import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRouteRedirects } from '../hooks/useRouteRedirects';

interface RouteRedirectMiddlewareProps {
  children: React.ReactNode;
}

export const RouteRedirectMiddleware: React.FC<RouteRedirectMiddlewareProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { redirects, isLoading, checkRedirect } = useRouteRedirects();

  useEffect(() => {
    const handleRedirect = async () => {
      if (isLoading) return;

      const currentPath = location.pathname;
      
      // Check if there's a redirect rule for the current path
      const redirect = await checkRedirect(currentPath);
      
      if (redirect) {
        console.log('🔄 ROUTE REDIRECT - Redirecting:', {
          from: redirect.from_path,
          to: redirect.to_path,
          type: redirect.redirect_type
        });

        // Perform the redirect
        navigate(redirect.to_path, { replace: true });
      }
    };

    handleRedirect();
  }, [location.pathname, isLoading, checkRedirect, navigate]);

  // Also check against the cached redirects for immediate redirects
  useEffect(() => {
    if (isLoading || redirects.length === 0) return;

    const currentPath = location.pathname;
    const redirect = redirects.find(r => r.from_path === currentPath);

    if (redirect) {
      console.log('🔄 ROUTE REDIRECT - Immediate redirect:', {
        from: redirect.from_path,
        to: redirect.to_path,
        type: redirect.redirect_type
      });

      navigate(redirect.to_path, { replace: true });
    }
  }, [location.pathname, redirects, isLoading, navigate]);

  return <>{children}</>;
};

export default RouteRedirectMiddleware;
