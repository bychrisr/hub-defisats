import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the Register component
const Register = lazy(() => import('./Register'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        Loading registration form...
      </p>
    </div>
  </div>
);

// Wrapper component with Suspense
const RegisterLazy = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Register />
    </Suspense>
  );
};

export default RegisterLazy;
