import React, { useEffect, useState } from 'react';
import { fetchApi, uploadFile, openProtectedFile } from '../api';
import ProtectedImage from '../components/ProtectedImage';
import { Link } from 'react-router-dom';
import JobCard from '../components/JobCard';

export default function SeekerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recommendedPeople, setRecommendedPeople] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [prof, myApps, dashboard, jobs, people] = await Promise.all([
        fetchApi('/seeker/profile'),
        fetchApi('/seeker/applications'),
        fetchApi('/seeker/dashboard'),
        fetchApi('/seeker/jobs?limit=3'),
        fetchApi('/seeker/recommendations?limit=3'),
      ]);
      setProfile(prof);
      setApps(myApps);
      setSummary(dashboard);
      setRecommendedJobs(jobs.items || jobs);
      setRecommendedPeople(people.items || people);
      setError('');
    } catch (e) {
      console.error(e);
      setError('We could not refresh your dashboard. Please try again.');
    }
  };

  useEffect(() => { loadData(); }, []);

  const [uploading, setUploading] = useState(false);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    try {
      await fetchApi('/seeker/profile', { method: 'PATCH', body: JSON.stringify(payload) });
      setEditing(false);
      loadData();
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName = 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const data = await uploadFile(file, fieldName);
      if (fieldName === 'avatar' || fieldName === 'cover') {
        loadData();
        return;
      }
      // Immediately save it to profile so it isn't lost
      await fetchApi('/seeker/profile', { 
        method: 'PATCH', 
        body: JSON.stringify({ ...profile, resumeUrl: data.url }) 
      });
      loadData();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const withdraw = async (id: string) => {
    if (!confirm('Withdraw this application?')) return;
    try { await fetchApi(`/seeker/applications/${id}/withdraw`, { method: 'POST' }); loadData(); } catch (e: any) { alert(e.message); }
  };

  if (!profile) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-zinc-500">Loading your professional dashboard...</div>;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      {error && <div role="alert" className="mb-5 flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"><span>{error}</span><button onClick={loadData} className="font-semibold underline">Retry</button></div>}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="h-28 bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-violet-500/30 sm:h-36">
          {profile.coverPhotoUrl && <ProtectedImage src={profile.coverPhotoUrl} alt="" className="h-full w-full object-cover opacity-80" />}
        </div>
        <div className="relative px-5 pb-5 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#0f1115] bg-cyan-400 text-2xl font-bold text-black sm:h-24 sm:w-24">{profile.avatarUrl ? <ProtectedImage src={profile.avatarUrl} alt={profile.fullName || 'Profile'} className="h-full w-full object-cover" /> : (profile.fullName || profile.email).slice(0, 1).toUpperCase()}</div>
              <div className="pb-1"><h1 className="text-2xl font-bold text-white sm:text-3xl">{profile.fullName || 'Build your profile'}</h1><p className="text-sm text-zinc-400">{profile.preferredTitle || 'Professional profile'}{profile.location ? ` · ${profile.location}` : ''}</p></div>
            </div>
            <button onClick={() => setEditing(!editing)} className="rounded-lg border border-cyan-400/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-400/10">{editing ? 'Cancel' : 'Edit profile'}</button>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-zinc-400">{profile.about || 'Add a short introduction so recruiters and peers can understand what you do.'}</p>
        </div>
      </section>

      {summary && <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[['Profile strength', `${summary.profileCompletion}%`], ['Applications', summary.statusCounts?.reduce((n: number, item: any) => n + item.count, 0) || 0], ['Saved jobs', summary.savedJobs], ['Unread alerts', summary.unreadNotifications], ['Interviews', summary.interviews?.length || 0]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs text-zinc-500">{label}</div><div className="mt-1 text-2xl font-bold text-cyan-300">{value}</div></div>)}
      </div>}

      {editing ? (
        <form onSubmit={handleUpdate} className="mt-5 grid grid-cols-1 gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2 sm:p-8">
          {[
            { label: 'Full Name', name: 'fullName' },
            { label: 'Professional Headline', name: 'headline' },
            { label: 'Phone Number', name: 'phone' },
            { label: 'Location', name: 'location' },
            { label: 'Preferred Title', name: 'preferredTitle' },
            { label: 'Expected Salary', name: 'expectedSalary' },
          ].map(f => (
            <div key={f.name} className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">{f.label}</label>
              <input type="text" name={f.name} defaultValue={profile[f.name] || ''} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
          ))}
          <div className="col-span-full flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">About</label>
            <textarea name="about" defaultValue={profile.about || ''} rows={4} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Profile Photo</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => handleFileUpload(e, 'avatar')} className="text-xs text-zinc-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cover Photo</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => handleFileUpload(e, 'cover')} className="text-xs text-zinc-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Resume Document</label>
            <div className="flex items-center gap-4">
              <label className="px-4 py-3 bg-zinc-900/80 border border-white/5 hover:border-cyan-500/50 text-white font-mono text-sm transition-colors cursor-pointer w-full flex justify-between items-center">
                <span className="truncate">{uploading ? 'UPLOADING...' : (profile.resumeUrl ? profile.resumeUrl.split('/').pop() : 'NO FILE UPLOADED')}</span>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest ml-4">BROWSE</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
              </label>
            </div>
          </div>
          <div className="col-span-full flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Skills</label>
            <input type="text" name="skills" defaultValue={profile.skills || ''} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60" />
          </div>
          <div className="col-span-full mt-6 pt-6 border-t border-white/5">
            <button type="submit" className="rounded-lg bg-cyan-400 px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-300">Save profile</button>
          </div>
        </form>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Your activity</h2><Link to="/notifications" className="text-xs text-cyan-300 hover:underline">View alerts</Link></div>
            <div className="space-y-3">{(summary?.recentApplications || apps).slice(0, 4).map((app: any) => <div key={app._id || app.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/10 p-4"><div><p className="font-medium text-white">{app.jobId?.title || app.job?.title || 'Job application'}</p><p className="mt-1 text-xs text-zinc-500">{app.jobId?.company || app.job?.company || 'Application'} · {new Date(app.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">{app.status}</span></div>)}{!(summary?.recentApplications || apps).length && <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">Your application activity will appear here.</p>}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Profile checklist</h2><span className="text-sm text-cyan-300">{summary?.profileCompletion || 0}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${summary?.profileCompletion || 0}%` }} /></div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">Complete your profile, add your skills, and upload a resume to stand out in search.</p>
            <button onClick={() => setEditing(true)} className="mt-4 text-sm font-semibold text-cyan-300 hover:underline">Improve your profile →</button>
          </div>
        </div>
      )}

      {!editing && <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 lg:col-span-2"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Recommended jobs</h2><Link to="/jobs" className="text-xs text-cyan-300 hover:underline">Explore all</Link></div>{recommendedJobs.length ? <div className="grid gap-5 md:grid-cols-3">{recommendedJobs.map(job => <JobCard key={job._id || job.id} job={job} />)}</div> : <p className="text-sm text-zinc-500">New opportunities will appear here.</p>}</section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">People to know</h2><Link to="/people" className="text-xs text-cyan-300 hover:underline">Discover people</Link></div><div className="space-y-3">{recommendedPeople.map(person => <Link to={`/people/${person.id}`} key={person.id} className="flex items-center gap-3 rounded-xl border border-white/5 p-4 hover:border-cyan-400/40"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-bold text-cyan-300">{(person.profile?.fullName || person.username || 'P').slice(0, 1).toUpperCase()}</div><div><p className="font-medium text-white">{person.profile?.fullName || person.username || 'Professional'}</p><p className="mt-1 text-xs text-zinc-500">{person.profile?.preferredTitle || person.profile?.skills || 'Open to connect'}</p></div></Link>)}{!recommendedPeople.length && <p className="text-sm text-zinc-500">We’ll suggest professionals with similar skills.</p>}</div></section>
      </div>}
    </div>
  );
}
