import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { TagInput, FormInput } from '../components/UI';
import {
  SKILL_CATEGORIES, PRODUCT_CATEGORIES, EXPERIENCE_LEVELS, EXCHANGE_TYPES
} from '../utils/helpers';
import { User, Lock, Bell, Shield } from 'lucide-react';

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
];

const Settings = () => {
  const { userData, updateUserData, currentUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    displayName: userData?.displayName || '',
    bio: userData?.bio || '',
    location: userData?.location || '',
    experienceLevel: userData?.experienceLevel || 'Intermediate',
    preferredExchangeType: userData?.preferredExchangeType || 'Any',
    availability: userData?.availability || 'Flexible',
    skillsOffered: userData?.skillsOffered || [],
    skillsWanted: userData?.skillsWanted || [],
    productsOffered: userData?.productsOffered || [],
    productsWanted: userData?.productsWanted || [],
    languages: userData?.languages || ['English'],
  });

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserData(profile);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { toast.error("New passwords don't match."); return; }
    if (passwords.next.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, passwords.current);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, passwords.next);
      toast.success('Password changed!');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      if (err.code === 'auth/wrong-password') toast.error('Current password is incorrect.');
      else toast.error('Failed to change password.');
    } finally { setSaving(false); }
  };

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account and preferences.</p>
        </div>

        <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {SETTINGS_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-slate-900">Basic Info</h2>
              <div>
                <label className="form-label">Display Name</label>
                <input className="form-input" value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Bio</label>
                <textarea className="form-input resize-none" rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the community about yourself..." maxLength={300} />
                <p className="text-xs text-slate-400 mt-1">{profile.bio.length}/300</p>
              </div>
              <div>
                <label className="form-label">Location</label>
                <input className="form-input" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Mumbai, India" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Experience Level</label>
                  <select className="form-input" value={profile.experienceLevel} onChange={e => setProfile(p => ({ ...p, experienceLevel: e.target.value }))}>
                    {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Availability</label>
                  <select className="form-input" value={profile.availability} onChange={e => setProfile(p => ({ ...p, availability: e.target.value }))}>
                    {['Flexible', 'Weekdays', 'Weekends', 'Evenings Only', 'Limited'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-slate-900">Skills</h2>
              <div>
                <label className="form-label">Skills I Offer</label>
                <TagInput tags={profile.skillsOffered} onChange={v => setProfile(p => ({ ...p, skillsOffered: v }))} placeholder="Add skills..." suggestions={SKILL_CATEGORIES} />
              </div>
              <div>
                <label className="form-label">Skills I Want to Learn</label>
                <TagInput tags={profile.skillsWanted} onChange={v => setProfile(p => ({ ...p, skillsWanted: v }))} placeholder="What do you want to learn?" suggestions={SKILL_CATEGORIES} />
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-slate-900">Products</h2>
              <div>
                <label className="form-label">Products I Can Offer</label>
                <TagInput tags={profile.productsOffered} onChange={v => setProfile(p => ({ ...p, productsOffered: v }))} placeholder="Products you want to exchange..." suggestions={PRODUCT_CATEGORIES} />
              </div>
              <div>
                <label className="form-label">Products I'm Looking For</label>
                <TagInput tags={profile.productsWanted} onChange={v => setProfile(p => ({ ...p, productsWanted: v }))} placeholder="What products do you want?" suggestions={PRODUCT_CATEGORIES} />
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-bold text-slate-900 mb-4">Preferences</h2>
              <div>
                <label className="form-label">Preferred Exchange Type</label>
                <select className="form-input" value={profile.preferredExchangeType} onChange={e => setProfile(p => ({ ...p, preferredExchangeType: e.target.value }))}>
                  <option>Any</option>
                  {EXCHANGE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'security' && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required placeholder="••••••••" />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} required minLength={6} placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required placeholder="Repeat new password" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock size={15} /> Update Password</>}
              </button>
            </form>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
              <p className="font-semibold mb-1 flex items-center gap-1"><Shield size={14} /> Account</p>
              <p>Email: <span className="font-medium">{currentUser?.email}</span></p>
              <p className="mt-1 text-slate-400 text-xs">Emails cannot be changed. Contact support if needed.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
