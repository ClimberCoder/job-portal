import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';

export default function AdminJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [seekers, setSeekers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  
  const loadData = async () => {
    try {
      const [jobsData, seekersData] = await Promise.all([
        fetchApi('/admin/jobs'),
        fetchApi('/admin/seekers')
      ]);
      setJobs(jobsData);
      setSeekers(seekersData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    // Formatting numerical and null values
    if (!payload.assignedToId) payload.assignedToId = '';
    payload.openings = payload.openings ? Number(payload.openings) : 1;
    
    try {
      const targetId = editingJob?._id || editingJob?.id;
      if (targetId) {
        await fetchApi(`/admin/jobs/${targetId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/admin/jobs', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsCreating(false);
      setEditingJob(null);
      loadData();
    } catch (e) {
      alert('Error saving job');
    }
  };

  return (
    <div className="py-12">
      <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Job Configuration.</h1>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Manage listings & assignments</p>
        </div>
        <button 
          onClick={() => { setIsCreating(!isCreating); setEditingJob(null); }}
          className="bg-cyan-500 text-black px-6 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-cyan-400 transition-colors"
        >
          {isCreating ? 'CANCEL' : 'CREATE NEW JOB'}
        </button>
      </div>

      {(isCreating || editingJob) && (
        <form onSubmit={handleSave} className="bg-zinc-900/30 border border-white/5 p-12 mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-full mb-4 border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">{editingJob ? 'Update Configuration' : 'Initialize New Listing'}</h2>
          </div>
          
          {[
            { label: 'Job Title', name: 'title', type: 'text', required: true },
            { label: 'Company', name: 'company', type: 'text', required: true },
            { label: 'Category', name: 'category', type: 'text', required: true },
            { label: 'Location', name: 'location', type: 'text' },
            { label: 'Employment Type', name: 'employmentType', type: 'text', placeholder: 'e.g. Full-Time, Remote' },
            { label: 'Salary Range', name: 'salaryRange', type: 'text' },
            { label: 'Skills Required', name: 'skillsRequired', type: 'text' },
            { label: 'Openings', name: 'openings', type: 'number', defaultValue: '1' },
          ].map((f) => (
            <div key={f.name} className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{f.label}</label>
              <input type={f.type} name={f.name} required={f.required} defaultValue={editingJob?.[f.name] || f.defaultValue || ''} placeholder={f.placeholder} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-sm transition-colors rounded-none" />
            </div>
          ))}

          <div className="col-span-full flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Description</label>
            <textarea name="description" required rows={4} defaultValue={editingJob?.description || ''} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-sm transition-colors rounded-none" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Visibility</label>
            <select name="visibility" defaultValue={editingJob?.visibility || 'PUBLIC'} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-sm transition-colors rounded-none appearance-none">
              <option value="PUBLIC" className="bg-zinc-900">Public (All Seekers)</option>
              <option value="PRIVATE" className="bg-zinc-900">Private (Assigned Only)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Assign To Seeker (Optional)</label>
            <select name="assignedToId" defaultValue={editingJob?.assignedToId || ''} className="px-4 py-3 bg-zinc-900/80 border border-white/5 focus:outline-none focus:border-cyan-500/50 text-white font-mono text-sm transition-colors rounded-none appearance-none">
              <option value="" className="bg-zinc-900">-- No Assignment --</option>
              {seekers.map(s => {
                const sId = s.user._id || s.user.id;
                return (
                  <option key={sId} value={sId} className="bg-zinc-900">{s.profile?.fullName || s.user.email} ({s.user.email})</option>
                );
              })}
            </select>
          </div>

          <div className="col-span-full mt-8 pt-8 border-t border-white/5">
            <button type="submit" className="bg-white text-black px-8 py-4 text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors w-full">
              {editingJob ? 'EXECUTE UPDATE' : 'PUBLISH JOB'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {jobs.map(job => {
          const jobId = job._id || job.id;
          return (
            <div key={jobId} className="p-8 bg-zinc-900/30 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-white/10 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${job.status === 'PUBLISHED' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
                    {job.status}
                  </span>
                  {job.visibility === 'PRIVATE' && (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-widest">PRIVATE</span>
                  )}
                  {job.assignedToId && (
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> ASSIGNED
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-1">{job.title}</h3>
                <p className="text-xs font-mono text-zinc-500">{job.company} &bull; {job.location}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => { setEditingJob(job); setIsCreating(true); }} className="text-[10px] font-bold text-zinc-400 hover:text-cyan-400 uppercase tracking-widest transition-colors">EDIT</button>
                <button 
                  onClick={async () => {
                     if(confirm('Are you sure?')) {
                       await fetchApi(`/admin/jobs/${jobId}`, { method: 'DELETE' });
                       loadData();
                     }
                  }} 
                  className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                >
                  DELETE
                </button>
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && <div className="text-center py-12 text-zinc-500 font-mono text-sm uppercase tracking-widest">NO JOBS CONFIGURED</div>}
      </div>
    </div>
  );
}
