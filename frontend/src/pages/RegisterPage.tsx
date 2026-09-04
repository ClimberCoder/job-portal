import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, confirmPassword, fullName, username, role: 'SEEKER' })
      });
      if (data.token) {
        login(data.token, data.user);
        navigate('/jobs');
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/30 border border-white/5 p-12">
        <h1 className="text-4xl font-bold mb-2 tracking-tighter text-white">System Access</h1>
        <p className="text-sm text-zinc-500 mb-10 font-mono tracking-widest uppercase">Register to continue</p>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Confirm Password</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white rounded-none transition-colors font-mono" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Username</label>
            <input type="text" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" value={username} onChange={e => setUsername(e.target.value)} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white rounded-none transition-colors font-mono" placeholder="your_username" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Full Name</label>
            <input 
              type="text" 
              required 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white rounded-none transition-colors font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white rounded-none transition-colors font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white rounded-none transition-colors font-mono"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-cyan-500 text-black font-bold py-4 px-8 text-[11px] uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-50 transition-colors rounded-none"
          >
            {loading ? 'REGISTERING...' : 'INITIATE REGISTRATION'}
          </button>
          
          <div className="mt-6 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            ALREADY HAVE AN ACCOUNT? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 ml-2">LOGIN HERE</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
