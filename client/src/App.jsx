import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VcLoginPage from './pages/auth/VcLoginPage';
import VcRegisterPage from './pages/auth/VcRegisterPage';
import StartupLoginPage from './pages/auth/StartupLoginPage';
import StartupRegisterPage from './pages/auth/StartupRegisterPage';
import StudentLoginPage from './pages/auth/StudentLoginPage';
import StudentRegisterPage from './pages/auth/StudentRegisterPage';
import VcDashboard from './pages/dashboard/VcDashboard';
import StartupDashboard from './pages/dashboard/StartupDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/vc" element={<VcLoginPage />} />
      <Route path="/register/vc" element={<VcRegisterPage />} />
      <Route path="/login/startup" element={<StartupLoginPage />} />
      <Route path="/register/startup" element={<StartupRegisterPage />} />
      <Route path="/login/student" element={<StudentLoginPage />} />
      <Route path="/register/student" element={<StudentRegisterPage />} />
      <Route
        path="/dashboard/vc"
        element={
          <ProtectedRoute allowedRoles={["VC"]}>
            <VcDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/startup"
        element={
          <ProtectedRoute allowedRoles={["Startup"]}>
            <StartupDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute allowedRoles={["Student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
