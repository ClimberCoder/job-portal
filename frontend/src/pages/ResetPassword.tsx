import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

export default function ResetPassword() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  const [password, setPassword] = useState(''); const [code, setCode] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try { await fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: params.get('email'), token: params.get('token'), code, password }) }); setMessage('Password reset successfully.'); setTimeout(() => navigate('/login'), 800); }
    catch (e: any) { setError(e.message); }
  };
  return <div className="flex-1 flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md bg-zinc-900/30 border border-white/5 p-10 space-y-5">
    <h1 className="text-3xl font-bold text-white">Choose a new password</h1>{message && <div className="text-cyan-400">{message}</div>}{error && <div className="text-red-400">{error}</div>}
    <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 bg-zinc-900 border border-white/10 text-white" placeholder="Six-digit reset code" /><input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-zinc-900 border border-white/10 text-white" placeholder="At least 8 characters and a number" />
    <button className="w-full bg-cyan-500 text-black font-bold py-3">UPDATE PASSWORD</button><Link to="/login" className="block text-center text-cyan-400 text-sm">Cancel</Link>
  </form></div>;
}
