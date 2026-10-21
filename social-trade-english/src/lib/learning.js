export const LEARNING_KEY = 'tradetalk.learning.v1';
const emptyLearning = () => ({ favoriteIds: [], learnedIds: [] });

export function loadLearning() {
  try {
    const raw = localStorage.getItem(LEARNING_KEY);
    if (raw === null) return { ...emptyLearning(), error: '' };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || ['favoriteIds', 'learnedIds'].some(key =>
      !Array.isArray(parsed[key]) || parsed[key].some(id => typeof id !== 'string' || !id.trim()))) {
      throw new Error('Invalid learning data');
    }
    return {
      favoriteIds: [...new Set(parsed.favoriteIds)],
      learnedIds: [...new Set(parsed.learnedIds)],
      error: '',
    };
  } catch {
    return { ...emptyLearning(), error: '学习记录读取失败，暂时展示空记录。请检查浏览器存储权限或备份原数据后重试。' };
  }
}

export function saveLearning({ favoriteIds, learnedIds }) {
  localStorage.setItem(LEARNING_KEY, JSON.stringify({ favoriteIds, learnedIds }));
}

export function toggleId(ids, id) {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
}

export function filterStudyCards(cards, { scene = null, favoritesOnly = false, favoriteIds = [] } = {}) {
  const favorites = new Set(favoriteIds);
  return cards.filter(card => (scene === null || card.scene === scene) && (!favoritesOnly || favorites.has(card.id)));
}

export function pickNextCard(cards, currentId, random = Math.random) {
  const candidates = cards.filter(card => card.id !== currentId);
  if (!candidates.length) return cards[0] ?? null;
  return candidates[Math.floor(random() * candidates.length)];
}

export function getLearningStats(cards, learnedIds) {
  const learned = new Set(learnedIds);
  const total = cards.length;
  const count = cards.filter(card => learned.has(card.id)).length;
  return { total, count, percent: total ? Math.round(count / total * 100) : 0 };
}

export function getSceneGroups(cards, learnedIds) {
  const groups = new Map();
  for (const card of cards) {
    if (!groups.has(card.scene)) groups.set(card.scene, []);
    groups.get(card.scene).push(card);
  }
  return [...groups].map(([scene, items]) => ({ scene, ...getLearningStats(items, learnedIds) }));
}
