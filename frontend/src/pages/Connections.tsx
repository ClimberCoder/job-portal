import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api';

export default function Connections() {
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState('all');
  const [error, setError] = useState('');
  const load = () => fetchApi('/seeker/connections?limit=50').then(data => setItems(data.items || [])).catch(e => setError(e.message || 'Unable to load network'));
  useEffect(load, []);
  const respond = async (id: string, status: string) => { try { await fetchApi(`/seeker/connections/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); } catch (e: any) { setError(e.message); } };
  const remove = async (id: string) => { try { await fetchApi(`/seeker/connections/${id}`, { method: 'DELETE' }); load(); } catch (e: any) { setError(e.message); } };
  const filtered = useMemo(() => tab === 'all' ? items : items.filter(item => tab === 'requests' ? item.status === 'PENDING' && item.direction === 'INCOMING' : tab === 'connected' ? item.status === 'ACCEPTED' : item.status === 'PENDING' && item.direction === 'OUTGOING'), [items, tab]);
  return <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
    <div className="mb-7"><p className="text-sm text-cyan-300">Your network</p><h1 className="mt-1 text-3xl font-bold text-white">Network</h1><p className="mt-2 text-sm text-zinc-400">Manage connections, requests, and new professional relationships.</p></div>
    <div className="mb-6 flex flex-wrap gap-2">{[['all', 'All activity'], ['connected', 'My connections'], ['requests', 'Connection requests'], ['sent', 'Sent requests']].map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider ${tab === value ? 'bg-cyan-400 text-black' : 'border border-white/10 text-zinc-400 hover:text-white'}`}>{label}</button>)}</div>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
    {filtered.length ? <div className="space-y-3">{filtered.map(item => <div key={item._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div><Link to={`/people/${item.person?._id}`} className="font-semibold text-white hover:text-cyan-300">{item.profile?.fullName || item.person?.email || 'Professional'}</Link><p className="mt-1 text-xs text-zinc-500">{item.profile?.preferredTitle || 'Professional connection'} · {item.status.toLowerCase()}</p></div><div className="flex gap-2">{item.status === 'PENDING' && item.direction === 'INCOMING' && <><button onClick={() => respond(item._id, 'ACCEPTED')} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-black">Accept</button><button onClick={() => respond(item._id, 'REJECTED')} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-300">Decline</button></>}{item.status === 'PENDING' && item.direction === 'OUTGOING' && <button onClick={() => remove(item._id)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-300">Cancel request</button>}{item.status === 'ACCEPTED' && <button onClick={() => remove(item._id)} className="rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-300">Remove</button>}</div></div>)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center"><h2 className="text-lg font-semibold text-white">{tab === 'requests' ? 'No pending connection requests.' : 'Build your professional network.'}</h2><p className="mt-2 text-sm text-zinc-400">Connect with people who share your skills and goals.</p><Link to="/people" className="mt-5 inline-flex rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black">Discover people</Link></div>}
  </div>;
}
