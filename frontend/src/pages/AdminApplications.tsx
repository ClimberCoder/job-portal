import { useEffect, useState } from 'react';
import { fetchApi } from '../api';

export default function AdminApplications() {
  const [apps, setApps] = useState<any[]>([]);

  const loadData = () => {
    fetchApi('/admin/applications').then(setApps).catch(console.error);
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/admin/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadData();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="py-12">
      <div className="mb-12 border-b border-white/5 pb-8">
        <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Application Tracking.</h1>
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Manage candidate pipeline</p>
      </div>

      <div className="grid gap-4">
        {apps.map(app => {
          const appId = app._id || app.id;
          return (
            <div key={appId} className="p-8 bg-zinc-900/30 border border-white/5 hover:border-cyan-500/30 transition-colors flex flex-col lg:flex-row gap-8 justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">JOB: {app.job?.title || 'Unknown Job'}</span>
                  <span className="text-[10px] text-zinc-600">&bull;</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white tracking-tight mb-1">{app.profile?.fullName || 'Anonymous Candidate'}</h3>
                <div className="text-sm text-zinc-400 font-mono mb-4">{app.user?.email}</div>
                
                {app.profile?.resumeUrl && (
                  <a href={app.profile.resumeUrl} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest hover:underline">
                    VIEW RESUME &rarr;
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-[200px]">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pipeline Status</label>
                <select 
                  value={app.status}
                  onChange={(e) => updateStatus(appId, e.target.value)}
                  className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-xs uppercase tracking-widest transition-colors rounded-none appearance-none"
                >
                  <option value="APPLIED" className="bg-zinc-900">APPLIED</option>
                  <option value="UNDER_REVIEW" className="bg-zinc-900">UNDER REVIEW</option>
                  <option value="SHORTLISTED" className="bg-zinc-900">SHORTLISTED</option>
                  <option value="INTERVIEW" className="bg-zinc-900">INTERVIEW</option>
                  <option value="SELECTED" className="bg-zinc-900">SELECTED</option>
                  <option value="REJECTED" className="bg-zinc-900 text-red-500">REJECTED</option>
                </select>
              </div>
            </div>
          );
        })}
        {apps.length === 0 && <div className="text-center py-12 text-zinc-500 font-mono text-sm uppercase tracking-widest">NO APPLICATIONS FOUND</div>}
      </div>
    </div>
  );
}
