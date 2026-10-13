import React from 'react';
import { getInitials, getAvatarColor } from '../utils/helpers';

export const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const s = sizes[size] || sizes.md;
  const color = getAvatarColor(user?.uid || user?.id || '');
  if (user?.avatar) return (
    <img src={user.avatar} alt={user.displayName} className={`${s} rounded-full object-cover flex-shrink-0 ${className}`} />
  );
  return (
    <div className={`${s} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {getInitials(user?.displayName || user?.name)}
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-3 skeleton rounded w-32" />
        <div className="h-2.5 skeleton rounded w-24" />
      </div>
    </div>
    <div className="h-3 skeleton rounded" />
    <div className="h-3 skeleton rounded w-3/4" />
    <div className="h-8 skeleton rounded-lg" />
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
    {description && <p className="text-slate-500 text-sm max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'badge-slate',
    green: 'badge-green',
    amber: 'badge-amber',
    red: 'badge-red',
    blue: 'badge bg-blue-50 text-blue-700 border border-blue-100',
    purple: 'badge bg-purple-50 text-purple-700 border border-purple-100',
    indigo: 'badge bg-indigo-50 text-indigo-700 border border-indigo-100',
  };
  return <span className={`${variants[variant] || variants.default} ${className}`}>{children}</span>;
};

export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const StatCard = ({ icon: Icon, label, value, color = 'emerald' }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 bg-${color}-50 rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={`text-${color}-600`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

export const FormInput = ({ label, error, ...props }) => (
  <div>
    {label && <label className="form-label">{label}</label>}
    <input className={`form-input ${error ? 'border-red-400' : ''}`} {...props} />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export const FormTextarea = ({ label, error, ...props }) => (
  <div>
    {label && <label className="form-label">{label}</label>}
    <textarea className={`form-input resize-none ${error ? 'border-red-400' : ''}`} {...props} />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export const FormSelect = ({ label, error, children, ...props }) => (
  <div>
    {label && <label className="form-label">{label}</label>}
    <select className={`form-input ${error ? 'border-red-400' : ''}`} {...props}>
      {children}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export const TagInput = ({ tags, onChange, placeholder, suggestions = [] }) => {
  const [input, setInput] = React.useState('');

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (t) => onChange(tags.filter(x => x !== t));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
  };

  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)).slice(0, 5);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 min-h-[44px]">
        {tags.map(t => (
          <span key={t} className="badge-green flex items-center gap-1">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="ml-0.5 hover:text-red-500">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
        />
      </div>
      {input && filtered.length > 0 && (
        <div className="border border-slate-200 rounded-xl mt-1 shadow-sm bg-white">
          {filtered.map(s => (
            <button key={s} type="button" onClick={() => addTag(s)}
              className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
