import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import AgeSelection from './pages/AgeSelection';
import WorldSelect from './pages/WorldSelect';
import PuzzlePlay from './pages/PuzzlePlay';
import ProfilePage from './pages/ProfilePage';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentDashboard from './pages/ParentDashboard';
import DrawingStudio from './pages/DrawingStudio';
import { useGameStore } from './stores/gameStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSetup } = useGameStore();
  if (!isSetup) return <Navigate to="/age-select" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/age-select" element={<AgeSelection />} />
        <Route path="/worlds" element={<ProtectedRoute><WorldSelect /></ProtectedRoute>} />
        <Route path="/play" element={<ProtectedRoute><PuzzlePlay /></ProtectedRoute>} />
        <Route path="/studio" element={<ProtectedRoute><DrawingStudio /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
