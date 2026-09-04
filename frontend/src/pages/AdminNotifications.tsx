import { useEffect, useState } from 'react';
import { fetchApi } from '../api';

export default function AdminNotifications() {
  const [items, setItems] = useState<any[]>([]); const [title, setTitle] = useState(''); const [message, setMessage] = useState('');
  const load = () => fetchApi('/admin/notifications?page=1&limit=50').then(data => setItems(data.items || data)).catch(console.error);
  useEffect(load, []);
  const send = async (event: React.FormEvent) => { event.preventDefault(); await fetchApi('/admin/notifications', { method: 'POST', body: JSON.stringify({ title, message }) }); setTitle(''); setMessage(''); load(); };
  const remove = async (id: string) => { await fetchApi(`/admin/notifications/${id}`, { method: 'DELETE' }); load(); };
  return <div className="py-12 px-6"><h1 className="text-4xl font-bold text-white mb-8">Notifications</h1><form onSubmit={send} className="border border-white/5 p-6 mb-8 grid gap-3 max-w-xl"><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="bg-zinc-900 p-3 text-white" /><textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" className="bg-zinc-900 p-3 text-white" /><button className="bg-cyan-500 text-black p-3 font-bold">SEND TO ALL SEEKERS</button></form>{items.map(item => <div key={item._id} className="border border-white/5 p-4 mb-2 flex justify-between"><div><b className="text-white">{item.title}</b><p className="text-zinc-400 text-sm">{item.message}</p></div><button onClick={() => remove(item._id)} className="text-red-400 text-xs">DELETE</button></div>)}</div>;
}
