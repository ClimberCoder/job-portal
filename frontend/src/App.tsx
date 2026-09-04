import { BrowserRouter, Routes, Route, Link, Navigate, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CircleUserRound, Home, Menu, Moon, Network, Sun, UsersRound, X, Bell, Bookmark, ChevronDown } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import GlobalSearch from './components/GlobalSearch';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SeekerDashboard from './pages/SeekerDashboard';
import SeekerJobs from './pages/SeekerJobs';
import AdminDashboard from './pages/AdminDashboard';
import AdminJobs from './pages/AdminJobs';
import AdminSeekers from './pages/AdminSeekers';
import AdminApplications from './pages/AdminApplications';
import JobDetails from './pages/JobDetails';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Settings from './pages/Settings';
import SavedJobs from './pages/SavedJobs';
import Notifications from './pages/Notifications';
import AdminAnalytics from './pages/AdminAnalytics';
import People from './pages/People';
import Connections from './pages/Connections';
import PersonProfile from './pages/PersonProfile';
import AdminInterviews from './pages/AdminInterviews';
import AdminNotifications from './pages/AdminNotifications';
import AdminAuditLogs from './pages/AdminAuditLogs';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('stackportal-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  useEffect(() => { localStorage.setItem('stackportal-theme', theme); document.documentElement.dataset.theme = theme; }, [theme]);
  
  return (
    <div className={`min-h-screen app-shell ${theme === 'light' ? 'theme-light' : 'theme-dark'} font-sans flex flex-col selection:bg-cyan-500/30`}>
      <nav className="border-b border-white/5 sticky top-0 z-50 bg-[#0F1115]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-20 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center font-bold text-black text-xl group-hover:bg-cyan-300 transition-colors">S</div>
            <span className="hidden sm:block text-xl font-semibold tracking-tight text-white">STACKPORTAL</span>
          </Link>
          {user?.role === 'SEEKER' && <GlobalSearch />}
          <button type="button" onClick={() => setMobileMenuOpen(value => !value)} className="ml-auto rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden" aria-label="Toggle navigation">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-1 border-b border-white/10 bg-[#11141a] p-4 md:static md:flex md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0`}>
            {user?.role === 'SEEKER' && (
              <>
                {[
                  ['/dashboard', 'Home', Home],
                  ['/jobs', 'Jobs', BriefcaseBusiness],
                  ['/connections', 'Network', Network],
                  ['/notifications', 'Alerts', Bell],
                ].map(([path, label, Icon]) => <NavLink key={String(path)} to={String(path)} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}><Icon size={15} />{String(label)}</NavLink>)}
                <div className="relative">
                  <button type="button" onClick={() => setProfileMenuOpen(value => !value)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:bg-white/5 hover:text-white md:w-auto"><CircleUserRound size={15} />Profile<ChevronDown size={14} /></button>
                  {profileMenuOpen && <div className="mt-1 rounded-lg border border-white/10 bg-[#171a21] p-1 md:absolute md:right-0 md:top-full md:mt-2 md:w-44"><NavLink to="/profile" onClick={() => { setProfileMenuOpen(false); setMobileMenuOpen(false); }} className="block rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white">My profile</NavLink><NavLink to="/saved-jobs" onClick={() => { setProfileMenuOpen(false); setMobileMenuOpen(false); }} className="block rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white">Saved jobs</NavLink><NavLink to="/settings" onClick={() => { setProfileMenuOpen(false); setMobileMenuOpen(false); }} className="block rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white">Settings</NavLink></div>}
                </div>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
                <Link to="/admin/jobs" className="hover:text-cyan-400 transition-colors">Jobs</Link>
                <Link to="/admin/seekers" className="hover:text-cyan-400 transition-colors">Seekers</Link>
                <Link to="/admin/applications" className="hover:text-cyan-400 transition-colors">Apps</Link>
                <Link to="/admin/analytics" className="hover:text-cyan-400 transition-colors">Analytics</Link>
                <Link to="/admin/interviews" className="hover:text-cyan-400 transition-colors">Interviews</Link>
                <Link to="/admin/notifications" className="hover:text-cyan-400 transition-colors">Notices</Link>
                <Link to="/admin/audit-logs" className="hover:text-cyan-400 transition-colors">Audit</Link>
              </>
            )}
            {!loading && (
              user ? (
                <button onClick={logout} className="ml-4 hidden border border-zinc-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-cyan-500 hover:text-cyan-400 transition-colors md:block">Sign Out</button>
              ) : (
                <div className="flex gap-4 ml-4">
                  <Link to="/login" className="px-6 py-2 border border-white/20 bg-white/5 hover:bg-white hover:text-black transition-all tracking-widest uppercase text-[10px] font-bold">Login</Link>
                  <Link to="/register" className="border border-white/20 bg-white/5 px-6 py-2 rounded-none hover:bg-white hover:text-black transition-all tracking-widest uppercase text-[10px] font-bold">Register</Link>
                </div>
              )
            )}
            <button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-zinc-400 hover:text-cyan-400" title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          <Route path="/jobs" element={
            <ProtectedRoute allowedRole="SEEKER"><SeekerJobs /></ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute allowedRole="SEEKER"><JobDetails /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRole="SEEKER"><SeekerJobs /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRole="SEEKER"><SeekerDashboard /></ProtectedRoute>
          } />
          <Route path="/saved-jobs" element={<ProtectedRoute allowedRole="SEEKER"><SavedJobs /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRole="SEEKER"><Notifications /></ProtectedRoute>} />
          <Route path="/people" element={<ProtectedRoute allowedRole="SEEKER"><People /></ProtectedRoute>} />
          <Route path="/people/:id" element={<ProtectedRoute allowedRole="SEEKER"><PersonProfile /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><PersonProfile /></ProtectedRoute>} />
          <Route path="/connections" element={<ProtectedRoute allowedRole="SEEKER"><Connections /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
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
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="ADMIN"><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/interviews" element={<ProtectedRoute allowedRole="ADMIN"><AdminInterviews /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRole="ADMIN"><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRole="ADMIN"><AdminAuditLogs /></ProtectedRoute>} />
        </Routes>
      </main>
      {user?.role === 'SEEKER' && <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#11141a]/95 px-2 py-2 backdrop-blur-xl md:hidden">
        {[
          ['/dashboard', 'Home', Home],
          ['/jobs', 'Jobs', BriefcaseBusiness],
          ['/connections', 'Network', Network],
          ['/notifications', 'Alerts', Bell],
          ['/profile', 'Profile', CircleUserRound],
        ].map(([path, label, Icon]) => <NavLink key={String(path)} to={String(path)} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-lg py-1 text-[9px] font-semibold ${isActive ? 'text-cyan-300' : 'text-zinc-500'}`}><Icon size={17} />{String(label)}</NavLink>)}
      </nav>}
      <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-zinc-500">
        Created by ClimberCoder <span className="text-zinc-300">Vansh</span>
      </footer>
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
