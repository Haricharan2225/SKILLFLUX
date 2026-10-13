import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TagInput } from '../components/UI';
import { SKILL_CATEGORIES, PRODUCT_CATEGORIES, EXPERIENCE_LEVELS, EXCHANGE_TYPES } from '../utils/helpers';
import { toast } from 'react-hot-toast';
import { User, MapPin, BookOpen, Package, ChevronRight, Check, Zap } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'About You', icon: User },
  { id: 2, title: 'Your Skills', icon: BookOpen },
  { id: 3, title: 'Your Products', icon: Package },
  { id: 4, title: 'Preferences', icon: Zap },
];

const Onboarding = () => {
  const { updateUserData, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    bio: '',
    location: '',
    experienceLevel: 'Intermediate',
    preferredExchangeType: 'Any',
    availability: 'Flexible',
    languages: ['English'],
    skillsOffered: [],
    skillsWanted: [],
    productsOffered: [],
    productsWanted: [],
    portfolioLinks: [],
  });

  const update = (field, val) => setProfile(p => ({ ...p, [field]: val }));

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updateUserData({ ...profile, onboardingComplete: true });
      toast.success('Profile set up! Welcome to SkillFlux 🎉');
      navigate('/dashboard');
    } catch {
      toast.error('Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    await updateUserData({ onboardingComplete: true });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-slate-50 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Set up your profile</h1>
          <p className="text-slate-500 text-sm mt-1">
            Hi {userData?.displayName?.split(' ')[0]}! Help others discover you. You can skip and update later.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === s.id ? 'bg-emerald-600 text-white' :
                step > s.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.id ? <Check size={12} /> : <s.icon size={12} />}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-4 ${step > s.id + 1 ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="card p-6">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="font-bold text-slate-900">About You</h2>
              <div>
                <label className="form-label">Bio <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Tell the community who you are and what you're passionate about..."
                  value={profile.bio}
                  onChange={e => update('bio', e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-slate-400 mt-1">{profile.bio.length}/200</p>
              </div>
              <div>
                <label className="form-label">Location <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="form-input pl-9"
                    placeholder="e.g. Bengaluru, India"
                    value={profile.location}
                    onChange={e => update('location', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Experience Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_LEVELS.map(l => (
                    <button key={l} type="button"
                      onClick={() => update('experienceLevel', l)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        profile.experienceLevel === l
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >{l}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="font-bold text-slate-900">Your Skills</h2>
              <div>
                <label className="form-label">Skills you can teach / offer</label>
                <TagInput
                  tags={profile.skillsOffered}
                  onChange={v => update('skillsOffered', v)}
                  placeholder="Type a skill and press Enter..."
                  suggestions={SKILL_CATEGORIES}
                />
                <p className="text-xs text-slate-400 mt-1">e.g. React Development, Python, UI Design</p>
              </div>
              <div>
                <label className="form-label">Skills you want to learn</label>
                <TagInput
                  tags={profile.skillsWanted}
                  onChange={v => update('skillsWanted', v)}
                  placeholder="What do you want to learn?"
                  suggestions={SKILL_CATEGORIES}
                />
              </div>
              <div>
                <label className="form-label">Languages</label>
                <TagInput
                  tags={profile.languages}
                  onChange={v => update('languages', v)}
                  placeholder="Add languages..."
                  suggestions={['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali']}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="font-bold text-slate-900">Products</h2>
              <div>
                <label className="form-label">Products you can offer / exchange</label>
                <TagInput
                  tags={profile.productsOffered}
                  onChange={v => update('productsOffered', v)}
                  placeholder="List products you want to exchange..."
                  suggestions={PRODUCT_CATEGORIES}
                />
                <p className="text-xs text-slate-400 mt-1">e.g. Mechanical Keyboard, Programming Book, Headphones</p>
              </div>
              <div>
                <label className="form-label">Products you're looking for</label>
                <TagInput
                  tags={profile.productsWanted}
                  onChange={v => update('productsWanted', v)}
                  placeholder="What products do you need?"
                  suggestions={PRODUCT_CATEGORIES}
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="font-bold text-slate-900">Preferences</h2>
              <div>
                <label className="form-label">Preferred Exchange Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Any', ...EXCHANGE_TYPES].map(t => (
                    <button key={t} type="button"
                      onClick={() => update('preferredExchangeType', t)}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium text-left transition-all ${
                        profile.preferredExchangeType === t
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Availability</label>
                <select className="form-input" value={profile.availability} onChange={e => update('availability', e.target.value)}>
                  {['Flexible', 'Weekdays', 'Weekends', 'Evenings Only', 'Limited'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={step === 1 ? skipOnboarding : () => setStep(s => s - 1)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {step === 1 ? 'Skip for now' : '← Back'}
            </button>
            <button
              onClick={step === STEPS.length ? handleFinish : () => setStep(s => s + 1)}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : step === STEPS.length ? (
                <><Check size={16} /> Complete Profile</>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
