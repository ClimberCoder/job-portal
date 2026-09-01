import React, { useEffect, useState } from 'react';
import { fetchApi, uploadFile } from '../api';

export default function SeekerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);

  const loadData = async () => {
    try {
      const [prof, myApps] = await Promise.all([
        fetchApi('/seeker/profile'),
        fetchApi('/seeker/applications')
      ]);
      setProfile(prof);
      setApps(myApps);
    } catch (e) {
      console.error(e);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const data = await uploadFile(file);
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

  if (!profile) return <div className="p-12 text-center text-zinc-500 font-mono text-sm uppercase tracking-widest">LOADING PROFILE...</div>;

  return (
    <div className="py-12">
      <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">My Profile.</h1>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{profile.email}</p>
        </div>
        <button 
          onClick={() => setEditing(!editing)}
          className="bg-white text-black px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors"
        >
          {editing ? 'CANCEL' : 'EDIT PROFILE'}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="bg-zinc-900/30 border border-white/5 p-12 mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { label: 'Full Name', name: 'fullName' },
            { label: 'Phone Number', name: 'phone' },
            { label: 'Location', name: 'location' },
            { label: 'Preferred Title', name: 'preferredTitle' },
            { label: 'Expected Salary', name: 'expectedSalary' },
          ].map(f => (
            <div key={f.name} className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{f.label}</label>
              <input type="text" name={f.name} defaultValue={profile[f.name] || ''} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-sm transition-colors rounded-none" />
            </div>
          ))}
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
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Skills</label>
            <input type="text" name="skills" defaultValue={profile.skills || ''} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-sm transition-colors rounded-none" />
          </div>
          <div className="col-span-full mt-6 pt-6 border-t border-white/5">
            <button type="submit" className="bg-cyan-500 text-black px-8 py-4 text-[11px] font-bold tracking-widest uppercase hover:bg-cyan-400 transition-colors">SAVE PROFILE</button>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-900/30 border border-white/5 p-12 mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Full Name</div>
            <div className="text-lg text-white tracking-tight">{profile.fullName || '--'}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Preferred Title</div>
            <div className="text-lg text-white tracking-tight font-mono">{profile.preferredTitle || '--'}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Location</div>
            <div className="text-sm text-zinc-400 font-mono">{profile.location || '--'}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Skills</div>
            <div className="text-sm text-cyan-400 font-mono">{profile.skills || '--'}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Resume Document</div>
            {profile.resumeUrl ? (
              <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-400 font-mono hover:underline">
                DOWNLOAD RESUME &rarr;
              </a>
            ) : (
              <div className="text-sm text-zinc-600 font-mono">--</div>
            )}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold tracking-tighter text-white mb-6">Application History</h2>
      <div className="grid gap-4">
        {apps.map(app => {
          const appId = app._id || app.id;
          return (
            <div key={appId} className="p-8 bg-zinc-900/30 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-1">{app.job?.title || 'Job Listing'}</h3>
                <p className="text-xs font-mono text-zinc-500">{app.job?.company || ''} &bull; {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <div className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest ${
                app.status === 'SELECTED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                app.status === 'INTERVIEW' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                app.status === 'SHORTLISTED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                'bg-zinc-800 text-zinc-400 border-white/5'
              }`}>
                {app.status}
              </div>
            </div>
          );
        })}
        {apps.length === 0 && <div className="text-center py-12 text-zinc-500 font-mono text-sm uppercase tracking-widest border border-white/5 border-dashed">NO APPLICATIONS FILED</div>}
      </div>
    </div>
  );
}
