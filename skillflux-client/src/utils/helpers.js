// Shared matching algorithm used across the app
export const getKeywords = (text = '') => {
  if (!text) return new Set();
  const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
  return new Set(words.filter(w => w.length > 2));
};

const CATEGORY_SYNONYMS = {
  'react': ['frontend', 'web', 'javascript', 'jsx'],
  'python': ['programming', 'coding', 'scripting', 'data'],
  'design': ['ui', 'ux', 'figma', 'graphic', 'visual'],
  'marketing': ['seo', 'growth', 'digital', 'ads'],
  'java': ['programming', 'coding', 'backend', 'spring'],
  'machine learning': ['ai', 'ml', 'data science', 'deep learning'],
  'video': ['editing', 'filmmaking', 'premiere', 'youtube'],
  'writing': ['content', 'copywriting', 'blog', 'documentation'],
};

const expandKeywords = (keywords) => {
  const expanded = new Set(keywords);
  keywords.forEach(kw => {
    Object.entries(CATEGORY_SYNONYMS).forEach(([key, synonyms]) => {
      if (kw === key || synonyms.includes(kw)) {
        expanded.add(key);
        synonyms.forEach(s => expanded.add(s));
      }
    });
  });
  return expanded;
};

export const calculateMatchScore = (text1, text2) => {
  const k1 = expandKeywords(getKeywords(text1));
  const k2 = expandKeywords(getKeywords(text2));
  if (k1.size === 0 || k2.size === 0) return 0;
  let matches = 0;
  k1.forEach(w => { if (k2.has(w)) matches++; });
  return Math.round((matches / Math.max(k1.size, k2.size)) * 100);
};

// Match a user's offerings against what they're looking for
export const findMatches = (myProfile, allUsers, allSkills, allProducts) => {
  const mySkillsOffered = (myProfile.skillsOffered || []).join(' ');
  const mySkillsWanted = (myProfile.skillsWanted || []).join(' ');
  const myProductsOffered = (myProfile.productsOffered || []).join(' ');
  const myProductsWanted = (myProfile.productsWanted || []).join(' ');

  const results = [];

  allUsers.forEach(user => {
    if (user.uid === myProfile.uid || user.isDemo) return;
    const theirOffered = (user.skillsOffered || []).join(' ') + ' ' + (user.productsOffered || []).join(' ');
    const theirWanted = (user.skillsWanted || []).join(' ') + ' ' + (user.productsWanted || []).join(' ');

    let score = 0;
    let reasons = [];

    // I offer what they want
    const s1 = calculateMatchScore(mySkillsOffered, theirWanted);
    if (s1 > 0) { score += s1; reasons.push('They want skills you offer'); }

    // They offer what I want
    const s2 = calculateMatchScore(theirOffered, mySkillsWanted + ' ' + myProductsWanted);
    if (s2 > 0) { score += s2; reasons.push('They offer what you\'re looking for'); }

    // I offer products they want
    const s3 = calculateMatchScore(myProductsOffered, theirWanted);
    if (s3 > 0) { score += s3; reasons.push('They need products you have'); }

    const avgScore = Math.min(Math.round(score / 2), 99);
    if (avgScore > 15) {
      results.push({ user, score: avgScore, reasons: reasons.slice(0, 2) });
    }
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 8);
};

export const EXCHANGE_TYPES = ['Skill for Skill', 'Skill for Product', 'Product for Skill', 'Product for Product'];

export const SKILL_CATEGORIES = [
  'Web Development', 'Java & Python', 'React & JavaScript', 'Artificial Intelligence',
  'Machine Learning', 'Data Analytics', 'UI/UX Design', 'Graphic Design',
  'Photography', 'Video Editing', 'Digital Marketing', 'Communication',
  'Languages', 'Academic Tutoring', 'Music & Creative Arts', 'Other'
];

export const PRODUCT_CATEGORIES = [
  'Books & Education', 'Electronics', 'Computer Accessories', 'Audio & Headphones',
  'Keyboards & Mice', 'Art Supplies', 'Sports Equipment', 'Clothing & Accessories',
  'Home & Lifestyle', 'Photography Gear', 'Study Tools', 'Other'
];

export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const PRODUCT_CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'For Parts'];

export const EXCHANGE_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  NEGOTIATING: 'Negotiating',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

// Valid state transitions
export const VALID_TRANSITIONS = {
  [EXCHANGE_STATUS.PENDING]: [EXCHANGE_STATUS.ACCEPTED, EXCHANGE_STATUS.REJECTED, EXCHANGE_STATUS.CANCELLED],
  [EXCHANGE_STATUS.ACCEPTED]: [EXCHANGE_STATUS.IN_PROGRESS, EXCHANGE_STATUS.CANCELLED],
  [EXCHANGE_STATUS.NEGOTIATING]: [EXCHANGE_STATUS.ACCEPTED, EXCHANGE_STATUS.REJECTED, EXCHANGE_STATUS.CANCELLED],
  [EXCHANGE_STATUS.IN_PROGRESS]: [EXCHANGE_STATUS.COMPLETED, EXCHANGE_STATUS.CANCELLED],
  [EXCHANGE_STATUS.COMPLETED]: [],
  [EXCHANGE_STATUS.REJECTED]: [],
  [EXCHANGE_STATUS.CANCELLED]: []
};

export const isValidTransition = (from, to) => {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
};

export const getStatusColor = (status) => {
  switch (status) {
    case EXCHANGE_STATUS.PENDING: return 'badge-amber';
    case EXCHANGE_STATUS.ACCEPTED: return 'badge-green';
    case EXCHANGE_STATUS.REJECTED: return 'badge-red';
    case EXCHANGE_STATUS.COMPLETED: return 'badge bg-indigo-50 text-indigo-700 border border-indigo-100';
    case EXCHANGE_STATUS.IN_PROGRESS: return 'badge bg-blue-50 text-blue-700 border border-blue-100';
    case EXCHANGE_STATUS.CANCELLED: return 'badge-slate';
    case EXCHANGE_STATUS.NEGOTIATING: return 'badge bg-purple-50 text-purple-700 border border-purple-100';
    default: return 'badge-slate';
  }
};

export const formatDate = (ts) => {
  if (!ts) return 'Recently';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const timeAgo = (ts) => {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
};

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
};

export const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500'
];

export const getAvatarColor = (uid = '') => {
  const idx = uid.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};
