import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api';
import JobCard from '../components/JobCard';

export default function SavedJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    fetchApi('/seeker/saved-jobs').then(setJobs).catch(() => setJobs([])).finally(() => setLoading(false));
  };
  useEffect(load, []);
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-cyan-300">Your collection</p><h1 className="mt-1 text-3xl font-bold text-white">Saved jobs</h1><p className="mt-2 text-sm text-zinc-400">Keep promising opportunities close while you decide.</p></div><Link to="/jobs" className="rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black">Find jobs</Link></div>
    {loading ? <div className="py-16 text-center text-zinc-500">Loading saved jobs...</div> : jobs.length ? <div className="grid gap-5 md:grid-cols-2">{jobs.map(job => <JobCard key={job._id || job.id} job={job} onChange={load} />)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center"><h2 className="text-xl font-semibold text-white">No saved jobs yet.</h2><p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">Find jobs you’re interested in and save them here for later.</p><Link to="/jobs" className="mt-6 inline-flex rounded-lg bg-cyan-400 px-5 py-3 text-xs font-bold uppercase tracking-wider text-black">Find jobs</Link></div>}
  </div>;
}
