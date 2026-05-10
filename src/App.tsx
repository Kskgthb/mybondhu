import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RequireAuth } from '@/components/common/RequireAuth';
import Header from '@/components/common/Header';
import MainLayout from '@/components/layout/MainLayout';
import SplashScreen from '@/components/common/SplashScreen';
import { GoogleMapsProvider } from '@/components/maps';
import GlobalTracker from '@/components/common/GlobalTracker';
import routes from './routes';

// Public paths that don't need authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/signup/bondhu',
  '/register/bondhu',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/terms-of-service',
  '/privacy-policy',
  '/404',
];

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown === 'true') {
      setShowSplash(false);
      setHasShownSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasShownSplash(true);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <Router>
      <GlobalTracker />
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <GoogleMapsProvider>
              <Toaster position="top-center" richColors closeButton />

              {/* Splash screen — shown only once per session */}
              {showSplash && !hasShownSplash && (
                <SplashScreen onComplete={handleSplashComplete} duration={3000} />
              )}

              <MainLayout>
                <RequireAuth whiteList={PUBLIC_PATHS}>
                  <Routes>
                    {routes.map((route) => (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={route.element}
                      />
                    ))}
                    {/* Catch-all: redirect unknown paths to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </RequireAuth>
              </MainLayout>
            </GoogleMapsProvider>
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
