// src/pages/Settings.tsx
import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

export function Settings() {
  const { user, updateAvatar } = useAuth();
  const { showToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { showToast({ title: 'Too Large', message: 'Max 2MB allowed.', type: 'error' }); return; }
      const reader = new FileReader();
      reader.onloadend = () => { updateAvatar(reader.result as string); setImgError(false); showToast({ title: 'Photo Updated', message: 'Your profile photo has been updated.', type: 'success' }); };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-extrabold text-slate-900">Settings</h1><p className="text-sm text-slate-500 mt-1">Manage your profile and preferences</p></div>

      {/* PROFILE PHOTO */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          {user.avatarUrl && !imgError ? (
            <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border-2 border-slate-200 object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-20 h-20 rounded-full bg-aims-green flex items-center justify-center text-white text-2xl font-bold">{user.name.charAt(0)}</div>
          )}
          <div>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90 mb-2">Upload New Photo</button>
            <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
        </div>
      </div>

      {/* PROFILE INFO */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label><input type="text" defaultValue={user.name} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input type="email" defaultValue={user.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label><input type="text" defaultValue={user.role.replace('_', ' ')} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label><input type="text" defaultValue={user.department} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" /></div>
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {[
            { label: 'Email notifications for approvals', defaultChecked: true },
            { label: 'Grant deadline reminders', defaultChecked: true },
            { label: 'Feed post notifications', defaultChecked: false },
            { label: 'System maintenance alerts', defaultChecked: true },
          ].map((pref, i) => (
            <label key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-sm font-medium text-slate-700">{pref.label}</span>
              <input type="checkbox" defaultChecked={pref.defaultChecked} className="w-4 h-4 rounded border-slate-300 text-aims-green focus:ring-aims-green" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}