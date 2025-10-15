import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const taxonomyPath = path.join(__dirname, '../../config/taxonomy.json');

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

/** Very simple keyword-based fallback classifier for Genres/Experiences */
export function keywordClassify(text = '') {
  const lower = text.toLowerCase();
  const groups = new Set();
  const experiences = new Set();

  taxonomy.genres.forEach(g => {
    if (g.keywords.some(k => lower.includes(k))) groups.add(g.name);
  });
  taxonomy.experiences.forEach(e => {
    if (e.keywords.some(k => lower.includes(k))) experiences.add(e.name);
  });

  return {
    groups: Array.from(groups),
    experiences: Array.from(experiences)
  };
}
