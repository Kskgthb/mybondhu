import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  whiteList?: string[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, whiteList = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isWhitelisted = whiteList.some(path => {
    if (path.endsWith('/*')) {
      const basePath = path.slice(0, -2);
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user && !isWhitelisted) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
