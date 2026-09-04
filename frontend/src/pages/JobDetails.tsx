import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi(`/seeker/jobs/${id}`)
      .then(setJob)
      .catch(() => alert('Job not found or unavailable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await fetchApi('/seeker/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId: id })
      });
      alert('Application submitted successfully!');
      navigate('/dashboard');
    } catch (e: any) {
      alert(e.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };
  const toggleSaved = async () => {
    try {
      await fetchApi(`/seeker/jobs/${id}/save`, { method: job.isSaved ? 'DELETE' : 'POST' });
      setJob({ ...job, isSaved: !job.isSaved });
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="p-12 text-center text-zinc-500 font-mono text-sm uppercase tracking-widest">LOADING LISTING...</div>;
  if (!job) return <div className="p-12 text-center text-red-500 font-mono text-sm uppercase tracking-widest">ERROR: LISTING NOT FOUND</div>;

  return (
    <div className="py-12 max-w-4xl mx-auto w-full">
      <Link to="/jobs" className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-cyan-400 transition-colors mb-8 inline-block">&larr; BACK TO LISTINGS</Link>
      
      <div className="bg-zinc-900/30 border border-white/5 p-12">
        <div className="flex items-center gap-2 mb-6">
          {job.visibility === 'PRIVATE' && (
            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-widest">ASSIGNED TO YOU</span>
          )}
          {job.employmentType && (
            <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">{job.employmentType}</span>
          )}
        </div>

        <h1 className="text-5xl font-bold tracking-tighter text-white mb-4">{job.title}</h1>
        <div className="text-lg font-mono text-cyan-400 mb-4">{job.company} &bull; {job.location || 'Remote'}</div>
        {job.deadline && <div className="text-xs text-amber-400 mb-8">Applications close {new Date(job.deadline).toLocaleString()}</div>}

        <div className="grid grid-cols-2 gap-8 mb-12 py-8 border-y border-white/5">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Salary Range</div>
            <div className="text-lg text-white font-mono">{job.salaryRange || 'Unspecified'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Openings</div>
            <div className="text-lg text-white font-mono">{job.openings}</div>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Required Skills</div>
            <div className="text-sm text-white font-mono">{job.skillsRequired || 'None specified'}</div>
          </div>
        </div>

        <div className="mb-12">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Job Description</div>
          <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </div>

        <div className="flex gap-3">
        <button onClick={toggleSaved} className="border border-cyan-500 text-cyan-400 px-6 py-5 text-sm font-bold tracking-widest uppercase">
          {job.isSaved ? 'SAVED' : 'SAVE JOB'}
        </button>
        <button 
          onClick={handleApply} 
          disabled={applying}
          className="w-full bg-cyan-500 text-black px-8 py-5 text-sm font-bold tracking-widest uppercase hover:bg-cyan-400 transition-colors disabled:opacity-50"
        >
          {applying ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
        </button>
        </div>
      </div>
    </div>
  );
}
