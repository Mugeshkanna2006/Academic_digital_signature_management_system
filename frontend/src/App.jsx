import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import UploadDocument from './pages/student/UploadDocument';
import MyDocuments from './pages/student/MyDocuments';
import AdminDashboard from './pages/admin/AdminDashboard';
import DocumentReview from './pages/admin/DocumentReview';
import Students from './pages/admin/Students';
import AuditLogs from './pages/admin/AuditLogs';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e4a',
              color: '#f1f5f9',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route path="/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute role="student"><UploadDocument /></PrivateRoute>} />
          <Route path="/my-documents" element={<PrivateRoute role="student"><MyDocuments /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/documents" element={<PrivateRoute role="admin"><DocumentReview /></PrivateRoute>} />
          <Route path="/admin/students" element={<PrivateRoute role="admin"><Students /></PrivateRoute>} />
          <Route path="/admin/audit-logs" element={<PrivateRoute role="admin"><AuditLogs /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
