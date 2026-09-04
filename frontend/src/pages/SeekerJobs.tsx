import { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import JobCard from '../components/JobCard';

export default function SeekerJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [workplaceType, setWorkplaceType] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), limit: '12', sort });
      if (query) params.set('q', query);
      if (location) params.set('location', location);
      if (workplaceType) params.set('workplaceType', workplaceType);
      if (employmentType) params.set('employmentType', employmentType);
      const data = await fetchApi(`/seeker/jobs?${params}`);
      setJobs(data.items || []);
      setPages(data.pages || 1);
      setError('');
    } catch (e: any) { setError(e.message || 'Unable to load jobs'); } finally { setLoading(false); }
  };
  useEffect(() => { loadJobs(page); }, [page, sort, workplaceType, employmentType]);
  const submit = (event: React.FormEvent) => { event.preventDefault(); setPage(1); loadJobs(1); };

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div className="mb-7"><p className="text-sm text-cyan-300">Opportunity discovery</p><h1 className="mt-1 text-3xl font-bold text-white">Find jobs</h1><p className="mt-2 text-sm text-zinc-400">Search roles by title, company, skills, location, or work style.</p></div>
    <form onSubmit={submit} className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-5">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search jobs, companies, skills..." className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60 lg:col-span-2" />
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60" />
      <select value={workplaceType} onChange={e => { setWorkplaceType(e.target.value); setPage(1); }} className="rounded-lg border border-white/10 bg-[#171a21] px-3 py-3 text-sm text-white"><option value="">Any workplace</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select>
      <select value={employmentType} onChange={e => { setEmploymentType(e.target.value); setPage(1); }} className="rounded-lg border border-white/10 bg-[#171a21] px-3 py-3 text-sm text-white"><option value="">Any job type</option><option value="Full-Time">Full-time</option><option value="Part-Time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option></select>
      <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="rounded-lg border border-white/10 bg-[#171a21] px-3 py-3 text-sm text-white"><option value="createdAt">Newest</option><option value="title">Title</option><option value="deadline">Deadline</option><option value="salaryMax">Highest salary</option></select>
      <button className="rounded-lg bg-cyan-400 px-4 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-300 sm:col-span-2 lg:col-span-1">Search</button>
    </form>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
    {loading ? <div className="py-16 text-center text-zinc-500">Finding opportunities...</div> : jobs.length ? <><div className="grid gap-5 md:grid-cols-2">{jobs.map(job => <JobCard key={job._id || job.id} job={job} onChange={() => loadJobs(page)} />)}</div><div className="mt-8 flex items-center justify-center gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white disabled:opacity-30">Previous</button><span className="text-xs text-zinc-500">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white disabled:opacity-30">Next</button></div></> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-400">No jobs match your search. Try a different skill, location, or filter.</div>}
  </div>;
}
