import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/sonner';

// Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Dashboard Layout
import DashboardLayout from './layouts/DashboardLayout';

// Dashboard Pages
import MenteeDashboard from './pages/dashboards/MenteeDashboard';
import MentorDashboard from './pages/dashboards/MentorDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

// Feature Pages
import FindMentorPage from './pages/FindMentorPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailsPage from './pages/SessionDetailsPage';
import GoalsPage from './pages/GoalsPage';
import SkillExchangePage from './pages/SkillExchangePage';
import MessagesPage from './pages/MessagesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanelPage from './pages/AdminPanelPage';
import RecommendationsPage from './pages/RecommendationsPage';
import RequestsPage from './pages/RequestsPage';

import { USER_ROLES } from './types';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardRedirect />} />
            <Route path="mentee" element={<MenteeDashboard />} />
            <Route path="mentor" element={<MentorDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          <Route
            path="/find-mentor"
            element={
              <PrivateRoute allowedRoles={[USER_ROLES.MENTEE]}>
                <DashboardLayout>
                  <FindMentorPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <SessionsPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <SessionDetailsPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <RequestsPage/>
                </DashboardLayout>
              </PrivateRoute>
            }
          />


          <Route
            path="/goals"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <GoalsPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/skill-exchange"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <SkillExchangePage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <MessagesPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <LeaderboardPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/recommendations"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <RecommendationsPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <DashboardLayout>
                  <AdminPanelPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case USER_ROLES.MENTEE:
      return <Navigate to="/dashboard/mentee" replace />;
    case USER_ROLES.MENTOR:
      return <Navigate to="/dashboard/mentor" replace />;
    case USER_ROLES.ADMIN:
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default App;