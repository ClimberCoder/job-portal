import { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { Link } from 'react-router-dom';

export default function SeekerJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const loadJobs = async (search = '') => {
    try {
      const data = await fetchApi(`/seeker/jobs${search ? `?q=${search}` : ''}`);
      setJobs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(query);
  };

  return (
    <div className="py-12">
      <div className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row gap-6 justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Available Positions.</h1>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Browse and apply</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search keywords..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="px-6 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-sm transition-colors rounded-none w-full md:w-64" 
          />
          <button type="submit" className="bg-white text-black px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors">
            SEARCH
          </button>
        </form>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {jobs.map(job => {
          const jobId = job._id || job.id;
          return (
            <div key={jobId} className="p-8 bg-zinc-900/30 border border-white/5 hover:border-cyan-500/50 transition-colors flex flex-col group">
              <div className="flex items-center gap-2 mb-4">
                {job.visibility === 'PRIVATE' && (
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-widest">ASSIGNED TO YOU</span>
                )}
                {job.employmentType && (
                  <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">{job.employmentType}</span>
                )}
              </div>
              
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2 group-hover:text-cyan-400 transition-colors">{job.title}</h3>
              <div className="text-sm font-mono text-zinc-500 mb-6">{job.company} &bull; {job.location || 'Remote'}</div>
              
              <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{job.salaryRange || 'Salary Unspecified'}</div>
                <Link to={`/jobs/${jobId}`} className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest hover:text-cyan-300">
                  VIEW DETAILS &rarr;
                </Link>
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && <div className="col-span-full text-center py-12 text-zinc-500 font-mono text-sm uppercase tracking-widest">NO POSITIONS FOUND</div>}
      </div>
    </div>
  );
}
