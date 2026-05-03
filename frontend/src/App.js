import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import RecipientDashboard from './pages/RecipientDashboard';
import RevolutionaryDonorDashboard from './pages/RevolutionaryDonorDashboard';
import ModernHospitalDashboard from './pages/ModernHospitalDashboard';
import MobileHospitalDashboard from './pages/MobileHospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function AppRoutes() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/recipient"
          element={
            <ProtectedRoute role="recipient">
              <RecipientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/donor"
          element={
            <ProtectedRoute role="donor">
              <RevolutionaryDonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/hospital"
          element={
            <ProtectedRoute role="hospital">
              <ModernHospitalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mobile/hospital"
          element={
            <ProtectedRoute role="hospital">
              <MobileHospitalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Navbar />
            <AppRoutes />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
