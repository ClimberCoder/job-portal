import { useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Search, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

type SearchResults = { people: any[]; jobs: any[] };

export default function GlobalSearch() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ people: [], jobs: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const companies = [...new Set(results.jobs.map(job => job.company).filter(Boolean))].slice(0, 5);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults({ people: [], jobs: [] });
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchApi(`/seeker/search?q=${encodeURIComponent(value)}&limit=5`);
        setResults({ people: data.people || [], jobs: data.jobs || [] });
        setOpen(true);
      } catch {
        setResults({ people: [], jobs: [] });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-xl">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-cyan-400/60 focus-within:bg-white/10 transition-colors">
        <Search size={17} className="text-zinc-500 shrink-0" aria-hidden="true" />
        <input
          value={query}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}
          placeholder="Search jobs, internships, people, companies..."
          aria-label="Search jobs and people"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-zinc-500 hover:text-white"><X size={16} /></button>}
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#171a21] shadow-2xl">
          {loading && <div className="px-4 py-5 text-sm text-zinc-500">Searching across jobs and professionals...</div>}
          {!loading && !results.people.length && !results.jobs.length && <div className="px-4 py-5 text-sm text-zinc-500">No matches yet. Try a skill or job title.</div>}
          {!loading && results.people.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">People</div>
              {results.people.map(person => <button key={person.id} onClick={() => go(`/people/${person.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/10">
                <UserRound size={16} className="text-cyan-400" />
                <span><span className="block text-sm text-white">{person.profile?.fullName || person.username || 'Professional'}</span><span className="block text-xs text-zinc-500">{person.profile?.preferredTitle || person.profile?.skills || 'Open to opportunities'}</span></span>
              </button>)}
            </div>
          )}
          {!loading && results.jobs.length > 0 && (
            <div className="border-t border-white/5 p-2">
              <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Jobs</div>
              {results.jobs.map(job => <button key={job._id || job.id} onClick={() => go(`/jobs/${job._id || job.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/10">
                <BriefcaseBusiness size={16} className="text-cyan-400" />
                <span><span className="block text-sm text-white">{job.title}</span><span className="block text-xs text-zinc-500">{job.company} · {job.location || 'Remote'}</span></span>
              </button>)}
            </div>
          )}
          {!loading && companies.length > 0 && (
            <div className="border-t border-white/5 p-2">
              <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Companies</div>
              {companies.map(company => <button key={company} onClick={() => { setQuery(company); setOpen(true); }} className="block w-full rounded-lg px-2 py-2 text-left text-sm text-white hover:bg-white/10">{company}</button>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
