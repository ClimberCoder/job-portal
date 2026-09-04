import { Bookmark, BookmarkCheck, BriefcaseBusiness, MapPin, WalletCards } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { fetchApi } from '../api';

export default function JobCard({ job, onChange }: { job: any; onChange?: () => void }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(Boolean(job.isSaved));
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const id = job._id || job.id;

  const toggleSaved = async () => {
    try {
      await fetchApi(`/seeker/jobs/${id}/save`, { method: saved ? 'DELETE' : 'POST' });
      setSaved(!saved);
      onChange?.();
    } catch (error: any) {
      setMessage(error.message || 'Unable to update saved jobs');
    }
  };

  const apply = async () => {
    setApplying(true);
    setMessage('');
    try {
      await fetchApi('/seeker/applications', { method: 'POST', body: JSON.stringify({ jobId: id }) });
      setMessage('Application submitted');
    } catch (error: any) {
      setMessage(error.message || 'Unable to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <article className="job-card-enter flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/5 transition hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
          {job.companyLogo ? <img src={job.companyLogo} alt="" className="h-full w-full rounded-xl object-cover" /> : <BriefcaseBusiness size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/jobs/${id}`} className="line-clamp-2 text-lg font-semibold text-white hover:text-cyan-300">{job.title}</Link>
          <p className="mt-1 text-sm text-zinc-400">{job.company}</p>
        </div>
        <button type="button" onClick={toggleSaved} aria-label={saved ? 'Remove saved job' : 'Save job'} className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-400/10">
          {saved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1"><MapPin size={13} />{job.location || 'Remote'}</span>
        {job.employmentType && <span className="rounded-full bg-white/5 px-2 py-1">{job.employmentType}</span>}
        {job.workplaceType && <span className="rounded-full bg-white/5 px-2 py-1">{job.workplaceType}</span>}
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">{job.description || 'Explore this opportunity and learn more about the role.'}</p>
      {job.skillsRequired && <div className="mt-4 flex flex-wrap gap-1.5">{job.skillsRequired.split(',').map((skill: string) => skill.trim()).filter(Boolean).slice(0, 6).map((skill: string) => <span key={skill} className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-200">{skill}</span>)}</div>}
      <div className="mt-auto pt-5">
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1"><WalletCards size={13} />{job.salaryRange || 'Salary not listed'}</span>
          <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently posted'}</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={apply} disabled={applying} className="flex-1 rounded-lg bg-cyan-400 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-300 disabled:opacity-50">{applying ? 'Applying...' : 'Apply'}</button>
          <button type="button" onClick={() => navigate(`/jobs/${id}`)} className="rounded-lg border border-white/15 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:border-cyan-300 hover:text-cyan-300">Details</button>
        </div>
        {message && <p role="status" className="mt-3 text-xs text-cyan-300">{message}</p>}
      </div>
    </article>
  );
}
