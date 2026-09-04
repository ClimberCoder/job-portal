import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api';
import { MapPin, UserPlus } from 'lucide-react';

export default function People() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    try {
      const [people, connections] = await Promise.all([fetchApi(`/seeker/people?limit=24${query ? `&q=${encodeURIComponent(query)}` : ''}`), fetchApi('/seeker/connections?limit=50')]);
      const statuses = new Map((connections.items || []).map((item: any) => [String(item.person?._id), item.status]));
      setItems((people.items || []).map((person: any) => ({ ...person, connectionStatus: statuses.get(String(person.id)) || '' })));
      setError('');
    } catch (e: any) { setError(e.message || 'Unable to load people'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const request = async (id: string) => { try { await fetchApi(`/seeker/connections/${id}`, { method: 'POST' }); load(); } catch (e: any) { setError(e.message); } };
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div className="mb-7"><p className="text-sm text-cyan-300">Professional discovery</p><h1 className="mt-1 text-3xl font-bold text-white">People</h1><p className="mt-2 text-sm text-zinc-400">Discover professionals by name, role, skills, or location.</p></div>
    <form onSubmit={e => { e.preventDefault(); load(); }} className="mb-8 flex gap-3"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people, titles, companies, skills..." className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60" /><button className="rounded-lg bg-cyan-400 px-5 py-3 text-xs font-bold uppercase tracking-wider text-black">Search</button></form>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
    {loading ? <div className="py-16 text-center text-zinc-500">Finding professionals...</div> : items.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">{(item.profile?.fullName || item.username || 'P').slice(0, 1).toUpperCase()}</div><div><h2 className="font-semibold text-white">{item.profile?.fullName || item.username || 'Professional'}</h2><p className="text-sm text-cyan-300">{item.profile?.preferredTitle || item.profile?.headline || 'Open to opportunities'}</p></div></div><p className="mt-4 flex items-center gap-1 text-xs text-zinc-500"><MapPin size={13} />{item.profile?.location || 'Location not listed'}</p><p className="mt-3 line-clamp-2 text-sm text-zinc-400">{item.profile?.skills || 'Skills not listed'}</p><div className="mt-5 flex gap-2"><Link to={`/people/${item.id}`} className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white hover:border-cyan-300 hover:text-cyan-300">View profile</Link><button disabled={item.connectionStatus === 'PENDING' || item.connectionStatus === 'ACCEPTED'} onClick={() => request(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold uppercase tracking-wider text-black disabled:bg-white/10 disabled:text-zinc-400">{item.connectionStatus === 'PENDING' ? 'Pending' : item.connectionStatus === 'ACCEPTED' ? 'Connected' : <><UserPlus size={14} />Connect</>}</button></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center"><h2 className="text-lg font-semibold text-white">Discover professionals and expand your network.</h2><p className="mt-2 text-sm text-zinc-400">Try searching for a skill, role, or location.</p></div>}
  </div>;
}
