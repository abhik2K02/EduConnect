import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import TeacherDashboard from './components/TeacherDashboard';
import StudentArchive from './components/StudentArchive';
import LectureClassView from './components/LectureClassView';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import Hyperspeed from './components/Hyperspeed';

// Cyberpunk Hyperspeed configuration
const CYBERPUNK_EFFECT = {
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xFFFFFF,
    brokenLines: 0xFFFFFF,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
    sticks: 0x03b3c3,
  }
};

function RootRedirect() {
  const { userRole, loading } = useAuth();
  if (loading) return null;
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'teacher') return <Navigate to="/teacher" replace />;
  if (userRole === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <>
      {/* Global 3D Hyperspeed Background - fixed behind all content */}
      <Hyperspeed effectOptions={CYBERPUNK_EFFECT} />

      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/" element={<Layout />}>
                <Route index element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="admin" element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Teacher Routes */}
                <Route path="teacher" element={
                  <ProtectedRoute allowedRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } />

                {/* Student Routes */}
                <Route path="student" element={
                  <ProtectedRoute allowedRole="student">
                    <StudentArchive />
                  </ProtectedRoute>
                } />
                <Route path="student/lecture/:id" element={
                  <ProtectedRoute allowedRole="student">
                    <LectureClassView />
                  </ProtectedRoute>
                } />

              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </>
  );
}

export default App
