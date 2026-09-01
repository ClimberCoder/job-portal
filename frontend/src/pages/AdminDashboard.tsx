import { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    fetchApi('/admin/stats').then(setStats).catch(console.error);
  }, []);

  return (
    <div className="py-12">
      <div className="mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 bg-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest font-bold rounded-sm">System Status</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>
        <h1 className="text-5xl font-bold tracking-tighter text-white">Admin Command.</h1>
        <p className="text-zinc-500 mt-4 text-sm font-mono uppercase tracking-widest max-w-xl leading-relaxed">
          Centralized management interface for job listings, seeker profiles, and application tracking.
        </p>
      </div>

      {!stats ? (
        <div className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Fetching telemetry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Seekers', value: stats.totalSeekers, border: 'border-cyan-500' },
            { label: 'Active Jobs', value: `${stats.activeJobs} / ${stats.totalJobs}`, border: 'border-blue-500' },
            { label: 'Pending Apps', value: stats.pendingApplications, border: 'border-purple-500' },
            { label: 'Shortlisted', value: stats.shortlistedCandidates, border: 'border-green-500' },
            { label: 'Total Apps', value: stats.totalApplications, border: 'border-zinc-500' }
          ].map((stat, i) => (
            <div key={i} className={`bg-zinc-900/30 border border-white/5 p-8 border-l-2 ${stat.border} hover:bg-zinc-900/50 transition-colors`}>
              <div className="text-4xl font-bold font-mono text-white tracking-tighter">{stat.value}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-4">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        <Link to="/admin/jobs" className="bg-white text-black px-8 py-4 text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors">Manage Jobs</Link>
        <Link to="/admin/applications" className="border border-zinc-700 px-8 py-4 text-[11px] font-bold tracking-widest uppercase hover:border-cyan-500 hover:text-cyan-400 transition-colors">Review Applications</Link>
      </div>
    </div>
  );
}
