import { useEffect, useState } from 'react';
import { fetchApi } from '../api';

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetchApi('/admin/analytics').then(setData).catch(console.error); }, []);
  if (!data) return <div className="p-12 text-zinc-500">LOADING ANALYTICS…</div>;
  return <div className="py-12 px-6"><h1 className="text-4xl font-bold text-white mb-8">Analytics</h1><div className="grid md:grid-cols-2 gap-6"><section className="border border-white/5 p-6"><h2 className="text-white font-bold mb-4">Applications by status</h2>{data.byStatus.map((item: any) => <div className="flex justify-between border-b border-white/5 py-2 text-sm" key={item._id}><span className="text-zinc-400">{item._id}</span><span className="text-cyan-400">{item.count}</span></div>)}</section><section className="border border-white/5 p-6"><h2 className="text-white font-bold mb-4">Jobs by category</h2>{data.byCategory.map((item: any) => <div className="flex justify-between border-b border-white/5 py-2 text-sm" key={item._id}><span className="text-zinc-400">{item._id || 'Uncategorized'}</span><span className="text-cyan-400">{item.count}</span></div>)}</section></div></div>;
}
