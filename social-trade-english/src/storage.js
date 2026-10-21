import { seedCards } from './data.js';

export { seedCards } from './data.js';
export const STORAGE_KEY = 'tradetalk.cards.v1';

export function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { cards: seedCards, error: '' };
    const cards = JSON.parse(raw);
    const fields = ['id', 'scene', 'english', 'chinese', 'example'];
    if (!Array.isArray(cards) || cards.some(card => !card ||
      fields.some(key => typeof card[key] !== 'string' || !card[key].trim())) ||
      new Set(cards.map(card => card.id)).size !== cards.length) {
      throw new Error('Invalid data');
    }
    // 旧版缓存也要补齐新词库，不能只在首次访问时读取初始数据。
    // 按稳定 id 合并：保留旧话术内容和自定义话术，内置话术统一场景名称。
    const savedById = new Map(cards.map(card => [card.id, card]));
    const seedIds = new Set(seedCards.map(card => card.id));
    const merged = [
      ...seedCards.map(seed => ({
        ...(savedById.get(seed.id) ?? seed),
        scene: seed.scene,
      })),
      ...cards.filter(card => !seedIds.has(card.id)),
    ];
    return { cards: merged, error: '' };
  } catch {
    return { cards: seedCards, error: '本地词库读取失败，暂时展示示例。请检查浏览器存储权限或备份本地数据后重试。' };
  }
}

export function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}
