import { useEffect, useState } from 'react';
import { fetchApi } from '../api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { fetchApi('/admin/audit-logs?page=1&limit=50').then(data => setLogs(data.items || data)).catch(console.error); }, []);
  return <div className="py-12 px-6 w-full"><h1 className="text-4xl font-bold text-white mb-8">Audit logs</h1><div className="overflow-x-auto border border-white/5"><table className="w-full text-left text-sm"><thead><tr className="text-zinc-500 uppercase text-[10px] tracking-widest"><th className="p-4">Time</th><th className="p-4">Actor</th><th className="p-4">Action</th><th className="p-4">Target</th></tr></thead><tbody>{logs.map(log => <tr key={log._id} className="border-t border-white/5 text-zinc-300"><td className="p-4 whitespace-nowrap">{new Date(log.createdAt || log.timestamp).toLocaleString()}</td><td className="p-4">{log.actorId?.email || 'System'}</td><td className="p-4">{log.action}</td><td className="p-4">{log.entityType} {log.entityId}</td></tr>)}{!logs.length && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No audit events.</td></tr>}</tbody></table></div></div>;
}
