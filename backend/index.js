import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000', 'https://skillflux.vercel.app'];

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// ─── Matching logic ────────────────────────────────────────────────────────────
const SYNONYMS = {
  react: ['frontend', 'web', 'javascript', 'jsx', 'ui'],
  python: ['programming', 'coding', 'scripting', 'data'],
  design: ['ui', 'ux', 'figma', 'graphic', 'visual'],
  marketing: ['seo', 'growth', 'digital', 'ads'],
  java: ['programming', 'coding', 'backend', 'spring'],
};

const getKeywords = (text = '') => {
  const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
  return new Set(words.filter(w => w.length > 2));
};

const expandKeywords = (keywords) => {
  const expanded = new Set(keywords);
  keywords.forEach(kw => {
    Object.entries(SYNONYMS).forEach(([key, syns]) => {
      if (kw === key || syns.includes(kw)) {
        expanded.add(key);
        syns.forEach(s => expanded.add(s));
      }
    });
  });
  return expanded;
};

const calculateMatchScore = (text1, text2) => {
  const k1 = expandKeywords(getKeywords(text1));
  const k2 = expandKeywords(getKeywords(text2));
  if (k1.size === 0 || k2.size === 0) return 0;
  let matches = 0;
  k1.forEach(w => { if (k2.has(w)) matches++; });
  return Math.min(Math.round((matches / Math.max(k1.size, k2.size)) * 100), 99);
};

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SkillFlux API is running',
    version: '2.0.0',
    endpoints: ['/health', '/api/match', '/api/match-bulk', '/api/stats']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Single match score
app.post('/api/match', (req, res) => {
  const { text1, text2, skill, product } = req.body;
  const t1 = text1 || skill?.title || '';
  const t2 = text2 || product?.requiredSkill || product?.desiredExchange || product?.title || '';

  if (!t1 || !t2) {
    return res.status(400).json({ error: 'text1 and text2 are required', score: 0 });
  }

  const score = calculateMatchScore(t1, t2);
  res.json({ score, text1: t1, text2: t2 });
});

// Bulk match — find best matches for a user
app.post('/api/match-bulk', (req, res) => {
  const { offered = [], wanted = [], items = [] } = req.body;

  if (!items.length) return res.json({ matches: [] });

  const offeredText = offered.join(' ');
  const wantedText = wanted.join(' ');

  const matches = items.map(item => {
    const itemText = [item.title, item.description, item.category, item.desiredExchange].filter(Boolean).join(' ');
    const scoreAgainstWanted = calculateMatchScore(itemText, wantedText);
    const scoreAgainstOffered = calculateMatchScore(item.desiredExchange || '', offeredText);
    const score = Math.round((scoreAgainstWanted + scoreAgainstOffered) / 2);
    return { ...item, matchScore: score };
  }).filter(m => m.matchScore > 10)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  res.json({ matches });
});

// Platform stats (returns basic structure; actual counts come from Firestore client-side)
app.get('/api/stats', (req, res) => {
  res.json({
    message: 'Stats are served from Firestore client-side for accuracy.',
    platform: 'SkillFlux v2.0',
    features: ['Skill Exchange', 'Product Exchange', 'Smart Matching', 'Real-time Chat', 'Notifications'],
    exchangeTypes: ['Skill for Skill', 'Skill for Product', 'Product for Skill', 'Product for Product'],
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SkillFlux API running on port ${PORT}`);
});
