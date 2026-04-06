import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Feeding from './pages/Feeding';
import Report from './pages/Report';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DeveloperInfo from './pages/DeveloperInfo';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import PageTransition from './components/PageTransition';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/developer-info" element={<DeveloperInfo />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="feeding" element={<PageTransition><Feeding /></PageTransition>} />
            <Route path="report" element={<PageTransition><Report /></PageTransition>} />
            <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}
