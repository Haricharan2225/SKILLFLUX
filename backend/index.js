import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple AI Matching Logic
const getKeywords = (text) => {
  return new Set(text.toLowerCase().match(/\b(\w+)\b/g).filter(word => word.length > 2));
};

const calculateMatchScore = (skillTitle, requiredSkill) => {
  const skillKeywords = getKeywords(skillTitle);
  const requiredKeywords = getKeywords(requiredSkill);
  
  if (skillKeywords.size === 0 || requiredKeywords.size === 0) return 0;
  
  let matches = 0;
  requiredKeywords.forEach(word => {
    if (skillKeywords.has(word)) matches++;
  });
  
  return Math.round((matches / Math.max(skillKeywords.size, requiredKeywords.size)) * 100);
};

app.get('/', (req, res) => {
  res.send('SkillFlux API is running...');
});

app.post('/api/match', (req, res) => {
  const { skill, product } = req.body;
  if (!skill || !product) {
    return res.status(400).json({ error: 'Skill and Product data required' });
  }
  
  const score = calculateMatchScore(skill.title, product.requiredSkill);
  res.json({ score });
});

app.get('/api/stats', (req, res) => {
  // Demo stats for now
  res.json({
    totalUsers: 12,
    totalSkills: 24,
    totalProducts: 18,
    activeExchanges: 5
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
