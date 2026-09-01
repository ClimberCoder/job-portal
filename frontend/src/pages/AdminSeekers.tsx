import { useEffect, useState } from 'react';
import { fetchApi } from '../api';

export default function AdminSeekers() {
  const [seekers, setSeekers] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/admin/seekers').then(setSeekers).catch(console.error);
  }, []);

  return (
    <div className="py-12">
      <div className="mb-12 border-b border-white/5 pb-8">
        <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Seeker Database.</h1>
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Registered user profiles</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {seekers.map(s => {
          const userId = s.user._id || s.user.id;
          return (
            <div key={userId} className="p-8 bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{s.profile?.fullName || 'Anonymous'}</h3>
                  <div className="text-xs font-mono text-zinc-500 mt-1">{s.user.email}</div>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">
                  ID: {userId}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Title</div>
                    <div className="text-sm text-zinc-300 font-mono">{s.profile?.preferredTitle || '--'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Location</div>
                    <div className="text-sm text-zinc-300 font-mono">{s.profile?.location || '--'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Skills</div>
                  <div className="text-sm text-zinc-300 font-mono">{s.profile?.skills || '--'}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Resume Document</div>
                  {s.profile?.resumeUrl ? (
                    <a href={s.profile.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-400 font-mono hover:underline">
                      VIEW DOCUMENT &rarr;
                    </a>
                  ) : (
                    <div className="text-sm text-zinc-600 font-mono">--</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
