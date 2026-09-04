import { useEffect, useState } from 'react';
import { fetchApi } from '../api';

export default function AdminInterviews() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => fetchApi('/admin/interviews').then(data => setItems(data.items || data)).catch(console.error);
  useEffect(load, []);
  const cancel = async (id: string) => { await fetchApi(`/admin/interviews/${id}`, { method: 'DELETE' }); load(); };
  return <div className="py-12 px-6"><h1 className="text-4xl font-bold text-white mb-8">Interviews</h1>{items.map(item => <div key={item._id} className="border border-white/5 p-5 mb-3 flex justify-between"><div><h2 className="text-white">{item.applicationId?.jobId?.title || 'Application interview'}</h2><p className="text-zinc-400">{new Date(item.scheduledAt).toLocaleString()} · {item.mode}</p></div>{item.status === 'SCHEDULED' && <button onClick={() => cancel(item._id)} className="text-red-400 text-xs">CANCEL</button>}</div>)}</div>;
}
