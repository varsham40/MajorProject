import { PasswordResetModal } from './components/PasswordResetModal';
import { DoctorManagementPage } from './pages/hospital/DoctorManagementPage';
import { HospitalRecordsManagement } from './pages/hospital/HospitalRecordsManagement';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { PatientDashboard } from './pages/patient/PatientDashboard';
import { MyHealthPage } from './pages/patient/MyHealthPage';
import { MyRecordsPage } from './pages/patient/MyRecordsPage';
import { MedicalReportsPage } from './pages/patient/MedicalReportsPage';
import { AccessSharingPage } from './pages/patient/AccessSharingPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';

import { DoctorOverview } from './pages/doctor/DoctorOverview';
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage';
import { DoctorPatients } from './pages/doctor/DoctorPatients';
import { NewAnalysisPage } from './pages/doctor/NewAnalysisPage';
import { RecordSharingPage } from './pages/doctor/RecordSharingPage';
import { TokenRedeemerPage } from './pages/doctor/TokenRedeemerPage';
import { DoctorRecordsPage } from './pages/doctor/DoctorRecordsPage';
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage';

import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { ReceivedRecordsPage } from './pages/hospital/ReceivedRecordsPage';
import { VerifyRecordPage } from './pages/hospital/VerifyRecordPage';
import { VerificationHistoryPage } from './pages/hospital/VerificationHistoryPage';
import { HospitalProfilePage } from './pages/hospital/HospitalProfilePage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { ModelRegistryPage } from './pages/admin/ModelRegistryPage';
import { ModelTrainingPage } from './pages/admin/ModelTrainingPage';
import { ModelAnalysisPage } from './pages/admin/ModelAnalysisPage';
import { BlockchainLedgerPage } from './pages/admin/BlockchainLedgerPage';

const ProtectedLayout: React.FC<{ allowedRoles: string[] }> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor/overview" replace />;
    if (user.role === 'HOSPITAL') return <Navigate to="/hospital/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }

  const currentPath = location.pathname;

  return (
    <div className="flex min-h-screen bg-dark-900">
      <PasswordResetModal />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {/* Patient Views persistent tab stack */}
          {user.role === 'PATIENT' && (
            <>
              <div className={currentPath === '/patient/dashboard' || currentPath === '/patient' ? 'block' : 'hidden'}>
                <PatientDashboard />
              </div>
              <div className={currentPath === '/patient/appointments' ? 'block' : 'hidden'}>
                <PatientAppointmentsPage />
              </div>
              <div className={currentPath === '/patient/health' ? 'block' : 'hidden'}>
                <MyHealthPage />
              </div>
              <div className={currentPath === '/patient/records' ? 'block' : 'hidden'}>
                <MyRecordsPage />
              </div>
              <div className={currentPath === '/patient/reports' ? 'block' : 'hidden'}>
                <MedicalReportsPage />
              </div>
              <div className={currentPath === '/patient/access-sharing' ? 'block' : 'hidden'}>
                <AccessSharingPage />
              </div>
              <div className={currentPath === '/patient/profile' ? 'block' : 'hidden'}>
                <PatientProfilePage />
              </div>
            </>
          )}

          {/* Doctor Views persistent tab stack */}
          {user.role === 'DOCTOR' && (
            <>
              <div className={currentPath === '/doctor/overview' || currentPath === '/doctor' ? 'block' : 'hidden'}>
                <DoctorOverview />
              </div>
              <div className={currentPath === '/doctor/appointments' ? 'block' : 'hidden'}>
                <DoctorAppointmentsPage />
              </div>
              <div className={currentPath === '/doctor/patients' ? 'block' : 'hidden'}>
                <DoctorPatients />
              </div>
              <div className={currentPath === '/doctor/new-analysis' ? 'block' : 'hidden'}>
                <NewAnalysisPage />
              </div>
              <div className={currentPath === '/doctor/record-sharing' || currentPath === '/doctor/token-redeemer' ? 'block' : 'hidden'}>
                <TokenRedeemerPage />
              </div>
              <div className={currentPath === '/doctor/records' ? 'block' : 'hidden'}>
                <DoctorRecordsPage />
              </div>
              <div className={currentPath === '/doctor/profile' ? 'block' : 'hidden'}>
                <DoctorProfilePage />
              </div>
            </>
          )}

          {/* Hospital Views persistent tab stack */}
          {user.role === 'HOSPITAL' && (
            <>
              <div className={currentPath === '/hospital/dashboard' || currentPath === '/hospital' ? 'block' : 'hidden'}>
                <HospitalDashboard />
              </div>
              <div className={currentPath === '/hospital/records-management' || currentPath === '/hospital/authorized-records' || currentPath === '/hospital/received-records' || currentPath === '/hospital/shared-records' || currentPath === '/hospital/verify-record' || currentPath === '/hospital/verification-history' ? 'block' : 'hidden'}>
                <HospitalRecordsManagement />
              </div>
              <div className={currentPath === '/hospital/doctors' || currentPath === '/hospital/doctor-management' ? 'block' : 'hidden'}>
                <DoctorManagementPage />
              </div>
              <div className={currentPath === '/hospital/profile' ? 'block' : 'hidden'}>
                <HospitalProfilePage />
              </div>
            </>
          )}

          {/* Admin Views persistent tab stack */}
          {user.role === 'ADMIN' && (
            <>
              <div className={currentPath === '/admin/dashboard' || currentPath === '/admin' ? 'block' : 'hidden'}>
                <AdminDashboard />
              </div>
              <div className={currentPath === '/admin/users' ? 'block' : 'hidden'}>
                <UserManagementPage />
              </div>
              <div className={currentPath === '/admin/model-registry' ? 'block' : 'hidden'}>
                <ModelRegistryPage />
              </div>
              <div className={currentPath === '/admin/model-training' ? 'block' : 'hidden'}>
                <ModelTrainingPage />
              </div>
              <div className={currentPath === '/admin/model-analysis' ? 'block' : 'hidden'}>
                <ModelAnalysisPage />
              </div>
              <div className={currentPath === '/admin/blockchain' ? 'block' : 'hidden'}>
                <BlockchainLedgerPage />
              </div>
              <div className={currentPath === '/admin/verification-logs' ? 'block' : 'hidden'}>
                <VerificationHistoryPage />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { user } = useAuthStore();

  const getDefaultRoute = () => {
    if (user?.role === 'PATIENT') return '/patient/dashboard';
    if (user?.role === 'DOCTOR') return '/doctor/overview';
    if (user?.role === 'HOSPITAL') return '/hospital/dashboard';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    return '/login';
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/patient/*" element={<ProtectedLayout allowedRoles={['PATIENT']} />} />
        <Route path="/doctor/*" element={<ProtectedLayout allowedRoles={['DOCTOR']} />} />
        <Route path="/hospital/*" element={<ProtectedLayout allowedRoles={['HOSPITAL']} />} />
        <Route path="/admin/*" element={<ProtectedLayout allowedRoles={['ADMIN']} />} />

        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
