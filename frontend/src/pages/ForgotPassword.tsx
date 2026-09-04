import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try { const data = await fetchApi('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(data.message + ' Check your email, then use the reset form.'); }
    catch (e: any) { setError(e.message); }
  };
  return <div className="flex-1 flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md bg-zinc-900/30 border border-white/5 p-10 space-y-5">
    <h1 className="text-3xl font-bold text-white">Reset password</h1><p className="text-sm text-zinc-500">Enter your email and we will send a secure reset link.</p>
    {message && <div className="text-cyan-400 text-sm">{message}</div>}{error && <div className="text-red-400 text-sm">{error}</div>}
    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-zinc-900 border border-white/10 text-white" />
    <button className="w-full bg-cyan-500 text-black font-bold py-3">SEND RESET LINK</button><Link to="/login" className="block text-center text-cyan-400 text-sm">Back to login</Link>
  </form></div>;
}
