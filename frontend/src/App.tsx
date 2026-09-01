import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SeekerDashboard from './pages/SeekerDashboard';
import SeekerJobs from './pages/SeekerJobs';
import AdminDashboard from './pages/AdminDashboard';
import AdminJobs from './pages/AdminJobs';
import AdminSeekers from './pages/AdminSeekers';
import AdminApplications from './pages/AdminApplications';
import JobDetails from './pages/JobDetails';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center font-mono text-zinc-500 uppercase tracking-widest text-sm">Authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <div className="p-8 text-center text-red-500 font-mono text-sm uppercase tracking-widest">Unauthorized Access</div>;
  }
  return <>{children}</>;
};

function AppContent() {
  const { user, logout, loading } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E4E4E7] font-sans flex flex-col selection:bg-cyan-500/30">
      <nav className="border-b border-white/5 sticky top-0 z-50 bg-[#0F1115]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-cyan-500 rounded-sm flex items-center justify-center font-bold text-black text-xl group-hover:bg-cyan-400 transition-colors">J</div>
            <span className="text-xl font-medium tracking-tight">STACKPORTAL</span>
          </Link>
          <div className="flex items-center gap-8 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            {user?.role === 'SEEKER' && (
              <>
                <Link to="/jobs" className="hover:text-cyan-400 transition-colors">Find Jobs</Link>
                <Link to="/dashboard" className="hover:text-cyan-400 transition-colors">My Profile</Link>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
                <Link to="/admin/jobs" className="hover:text-cyan-400 transition-colors">Jobs</Link>
                <Link to="/admin/seekers" className="hover:text-cyan-400 transition-colors">Seekers</Link>
                <Link to="/admin/applications" className="hover:text-cyan-400 transition-colors">Apps</Link>
              </>
            )}
            {!loading && (
              user ? (
                <button onClick={logout} className="ml-4 border border-zinc-700 px-6 py-2 rounded-none hover:border-cyan-500 hover:text-cyan-400 transition-colors tracking-widest uppercase text-[10px] font-bold">Sign Out</button>
              ) : (
                <div className="flex gap-4 ml-4">
                  <Link to="/login" className="px-6 py-2 border border-white/20 bg-white/5 hover:bg-white hover:text-black transition-all tracking-widest uppercase text-[10px] font-bold">Login</Link>
                  <Link to="/register" className="border border-white/20 bg-white/5 px-6 py-2 rounded-none hover:bg-white hover:text-black transition-all tracking-widest uppercase text-[10px] font-bold">Register</Link>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to={user?.role === 'ADMIN' ? '/admin' : '/jobs'} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/jobs" element={
            <ProtectedRoute allowedRole="SEEKER"><SeekerJobs /></ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute allowedRole="SEEKER"><JobDetails /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRole="SEEKER"><SeekerDashboard /></ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/jobs" element={
            <ProtectedRoute allowedRole="ADMIN"><AdminJobs /></ProtectedRoute>
          } />
          <Route path="/admin/seekers" element={
            <ProtectedRoute allowedRole="ADMIN"><AdminSeekers /></ProtectedRoute>
          } />
          <Route path="/admin/applications" element={
            <ProtectedRoute allowedRole="ADMIN"><AdminApplications /></ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
