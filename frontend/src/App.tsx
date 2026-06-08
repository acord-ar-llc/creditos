import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/AppLayout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Client pages
import ClientDashboard from "./pages/client/Dashboard";
import AccountDetail from "./pages/client/AccountDetail";
import LoanList from "./pages/client/LoanList";
import LoanDetail from "./pages/client/LoanDetail";
import CreditApplication from "./pages/client/CreditApplication";
import PaymentHistory from "./pages/client/PaymentHistory";
import Profile from "./pages/client/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import ClientListAdmin from "./pages/admin/ClientList";
import ClientDetailAdmin from "./pages/admin/ClientDetail";
import LoanManagement from "./pages/admin/LoanManagement";

import AuditLog from "./pages/admin/AuditLog";
import Collections from "./pages/admin/Collections";
import Reports from "./pages/admin/Reports";
import VendorListAdmin from "./pages/admin/VendorList";
import VendorDetailAdmin from "./pages/admin/VendorDetail";

// Vendor pages
import VendorDashboard from "./pages/vendor/Dashboard";
import NewPurchase from "./pages/vendor/NewPurchase";
import VendorPurchaseHistory from "./pages/vendor/PurchaseHistory";
import VendorBalance from "./pages/vendor/VendorBalance";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorClientRegister from "./pages/vendor/ClientRegister";

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const defaultRedirect = () => {
    if (!isAuthenticated) return "/login";
    if (user?.role === "admin") return "/admin/dashboard";
    if (user?.role === "vendor") return "/vendor/dashboard";
    return "/dashboard";
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={defaultRedirect()} replace /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to={defaultRedirect()} replace /> : <Register />
      } />

      {/* Client routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="client">
          <AppLayout><ClientDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute requiredRole="client">
          <AppLayout><AccountDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/loans" element={
        <ProtectedRoute requiredRole="client">
          <AppLayout><LoanList /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/loans/apply" element={
        <ProtectedRoute requiredRole="client">
          <AppLayout><CreditApplication /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/loans/:id" element={
        <ProtectedRoute requiredRole="client">
          <AppLayout><LoanDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute requiredRole="client">
          <AppLayout><PaymentHistory /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute requiredRole="client">
          <AppLayout><Profile /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Vendor routes */}
      <Route path="/vendor/dashboard" element={
        <ProtectedRoute requiredRole="vendor">
          <AppLayout><VendorDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/vendor/purchases/new" element={
        <ProtectedRoute requiredRole="vendor">
          <AppLayout><NewPurchase /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/vendor/purchases" element={
        <ProtectedRoute requiredRole="vendor">
          <AppLayout><VendorPurchaseHistory /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/vendor/balance" element={
        <ProtectedRoute requiredRole="vendor">
          <AppLayout><VendorBalance /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/vendor/profile" element={
        <ProtectedRoute requiredRole="vendor">
          <AppLayout><VendorProfile /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/vendor/clients/register" element={
        <ProtectedRoute requiredRole="vendor">
          <AppLayout><VendorClientRegister /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><AdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clients" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><ClientListAdmin /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clients/:id" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><ClientDetailAdmin /></AppLayout>
        </ProtectedRoute>
      } />
<Route path="/admin/loans" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><LoanManagement /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/collections" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><Collections /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><Reports /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/audit" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><AuditLog /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/vendors" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><VendorListAdmin /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/vendors/:id" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout><VendorDetailAdmin /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={defaultRedirect()} replace />} />
    </Routes>
  );
};

export default App;
