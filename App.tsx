
import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConfirmModal from './components/ConfirmModal';

// Page Imports
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Results from './pages/Results';
import Templates from './pages/Templates';
import Records from './pages/Records';
import PrintableInvoice from './pages/PrintableInvoice';
import LoginPage from './pages/Login';
import Users from './pages/Users';
import Settings from './pages/Settings';

const AppLayout = () => (
  <div className="flex h-screen bg-light-bg">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-bg p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { currentUser, confirmationState, hideConfirmation } = useAppContext();
  
  return (
    <>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/invoice/print/:invoiceId" element={<ProtectedRoute><PrintableInvoice /></ProtectedRoute>} />
        
        <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="services" element={<Services />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="billing" element={<Billing />} />
          <Route path="records" element={<Records />} />
          <Route path="results" element={<Results />} />
          <Route path="templates" element={<Templates />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <ConfirmModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
          hideConfirmation();
        }}
        onCancel={hideConfirmation}
      />
    </>
  );
};

export default App;
