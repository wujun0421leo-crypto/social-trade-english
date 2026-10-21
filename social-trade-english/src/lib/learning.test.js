import { describe, expect, it, vi } from 'vitest';
import { LEARNING_KEY, loadLearning, saveLearning, filterStudyCards, getLearningStats, getSceneGroups, pickNextCard } from './learning';

const cards = [
  { id: 'a', scene: 'MOQ' },
  { id: 'b', scene: 'MOQ' },
  { id: 'c', scene: '物流' },
];

describe('learning records and study pools', () => {
  it('persists and reloads favorites and learned cards without touching the word library', () => {
    localStorage.setItem('tradetalk.cards.v1', 'existing-library');
    saveLearning({ favoriteIds: ['a'], learnedIds: ['b'] });
    expect(loadLearning()).toEqual({ favoriteIds: ['a'], learnedIds: ['b'], error: '' });
    expect(localStorage.getItem('tradetalk.cards.v1')).toBe('existing-library');
  });

  it('handles absent, duplicate, and invalid records without overwriting stored data', () => {
    expect(loadLearning()).toEqual({ favoriteIds: [], learnedIds: [], error: '' });
    localStorage.setItem(LEARNING_KEY, JSON.stringify({ favoriteIds: ['a', 'a'], learnedIds: ['b', 'b'] }));
    expect(loadLearning().learnedIds).toEqual(['b']);
    for (const raw of ['{broken', 'null', '{}', '{"favoriteIds":[null],"learnedIds":[]}']) {
      localStorage.setItem(LEARNING_KEY, raw);
      expect(loadLearning().error).not.toBe('');
      expect(localStorage.getItem(LEARNING_KEY)).toBe(raw);
    }
  });

  it('surfaces read and write failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Denied'); });
    expect(loadLearning().error).not.toBe('');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
    expect(() => saveLearning({ favoriteIds: [], learnedIds: [] })).toThrow();
  });

  it('combines scene and favorites filtering, including empty sets', () => {
    expect(filterStudyCards(cards, { scene: 'MOQ' }).map(card => card.id)).toEqual(['a', 'b']);
    expect(filterStudyCards(cards, { scene: 'MOQ', favoritesOnly: true, favoriteIds: ['b', 'c'] })).toEqual([cards[1]]);
    expect(filterStudyCards(cards, { favoritesOnly: true })).toEqual([]);
    expect(filterStudyCards(cards, { scene: '不存在' })).toEqual([]);
  });

  it('never selects outside the filtered pool or repeats when another card exists', () => {
    const pool = filterStudyCards(cards, { scene: 'MOQ' });
    for (const random of [() => 0, () => 0.99]) expect(pickNextCard(pool, 'a', random).id).toBe('b');
    expect(pickNextCard([cards[0]], 'a')).toBe(cards[0]);
    expect(pickNextCard([], 'a')).toBeNull();
  });

  it('counts only existing cards and ignores duplicate or stale learned ids', () => {
    expect(getLearningStats(cards, ['a', 'a', 'deleted'])).toEqual({ count: 1, total: 3, percent: 33 });
    expect(getLearningStats([], ['a'])).toEqual({ count: 0, total: 0, percent: 0 });
    expect(getSceneGroups(cards, ['a', 'c'])).toEqual([
      { scene: 'MOQ', count: 1, total: 2, percent: 50 },
      { scene: '物流', count: 1, total: 1, percent: 100 },
    ]);
  });
});
