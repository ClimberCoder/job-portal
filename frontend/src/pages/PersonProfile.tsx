import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../api';
import ProtectedImage from '../components/ProtectedImage';

export default function PersonProfile() {
  const { id, username } = useParams(); const [person, setPerson] = useState<any>(null);
  useEffect(() => { fetchApi(username ? `/users/${username}` : `/seeker/people/${id}`).then(setPerson).catch(console.error); }, [id, username]);
  if (!person) return <div className="p-12 text-zinc-500">LOADING PROFILE…</div>;
  const connect = async () => { try { await fetchApi(`/seeker/connections/${person.id}`, { method: 'POST' }); setPerson({ ...person, connection: { status: 'PENDING' } }); } catch (error: any) { alert(error.message); } };
  return <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"><div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">{person.profile?.coverPhotoUrl && <ProtectedImage src={person.profile.coverPhotoUrl} className="h-40 w-full object-cover" alt="Cover" />}<div className="p-6"><h1 className="text-3xl font-bold text-white">{person.profile?.fullName || person.email}</h1><p className="mt-2 text-cyan-300">{person.profile?.headline || person.profile?.preferredTitle || 'Professional'}</p><p className="mt-4 text-sm text-zinc-400">{person.profile?.about || 'This professional has not added an introduction yet.'}</p><div className="mt-6 space-y-3 text-sm text-zinc-300"><p>{person.profile?.location || 'Location not listed'}</p><p>{person.profile?.skills || 'Skills not listed'}</p></div><div className="mt-6 flex gap-3"><button disabled={Boolean(person.connection?.status)} onClick={connect} className="rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black disabled:bg-white/10 disabled:text-zinc-400">{person.connection?.status === 'PENDING' ? 'Pending' : person.connection?.status === 'ACCEPTED' ? 'Connected' : 'Connect'}</button></div></div></div></div>;
}
