import type { ReactNode } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BondhuSignupPage from './pages/BondhuSignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import NeedBondhuDashboard from './pages/need-bondhu/Dashboard';
import BondhuDashboard from './pages/bondhu/Dashboard';
import TaskDetailPage from './pages/TaskDetailPage';
import TrackBondhu from './pages/TrackBondhu';
import NavigateToTask from './pages/bondhu/NavigateToTask';
import TaskTracking from './pages/tracking/TaskTracking';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/admin/Dashboard';
import BondhuRegistration from './pages/registration/BondhuRegistration';
import NotFound from './pages/NotFound';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  { name: 'Home',                  path: '/',                          element: <LandingPage /> },
  { name: 'Login',                 path: '/login',                     element: <LoginPage /> },
  { name: 'Sign Up',               path: '/signup',                    element: <SignupPage /> },
  { name: 'Bondhu Sign Up',        path: '/signup/bondhu',             element: <BondhuSignupPage /> },
  { name: 'Forgot Password',       path: '/forgot-password',           element: <ForgotPasswordPage /> },
  { name: 'Reset Password',        path: '/reset-password',            element: <ResetPasswordPage /> },
  { name: 'Auth Callback',         path: '/auth/callback',             element: <AuthCallbackPage /> },
  { name: 'Bondhu Registration',   path: '/register/bondhu',           element: <BondhuRegistration /> },
  { name: 'Need Bondhu Dashboard', path: '/need-bondhu/dashboard',     element: <NeedBondhuDashboard /> },
  { name: 'Bondhu Dashboard',      path: '/bondhu/dashboard',          element: <BondhuDashboard /> },
  { name: 'Task Detail',           path: '/task/:taskId',              element: <TaskDetailPage /> },
  { name: 'Track Bondhu',          path: '/track/:taskId',             element: <TrackBondhu /> },
  { name: 'Task Tracking',         path: '/tracking/:taskId',          element: <TaskTracking /> },
  { name: 'Navigate to Task',      path: '/bondhu/navigate/:taskId',   element: <NavigateToTask /> },
  { name: 'Notifications',         path: '/notifications',             element: <NotificationsPage /> },
  { name: 'Profile',               path: '/profile',                   element: <ProfilePage /> },
  { name: 'Settings',              path: '/settings',                  element: <SettingsPage /> },
  { name: 'Admin Dashboard',       path: '/admin/dashboard',           element: <AdminDashboard /> },
  { name: 'Not Found',             path: '/404',                       element: <NotFound /> },
];

export default routes;
