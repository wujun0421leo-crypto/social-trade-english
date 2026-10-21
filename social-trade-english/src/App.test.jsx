import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { seedCards } from './data';
import { LEARNING_KEY } from './lib/learning';

vi.mock('./components/PwaNotice', () => ({ default: () => null }));
vi.mock('./components/SpeakButton', () => ({ default: () => <button type="button">朗读</button> }));

const learningCard = () => screen.getByRole('article', { name: '学习卡片' });
const records = () => JSON.parse(localStorage.getItem(LEARNING_KEY));
const navigate = name => fireEvent.click(within(screen.getByRole('navigation', { name: '主导航' })).getByRole('button', { name }));

describe('learning experience', () => {
  it('shows every scene and keeps repeated draws inside the chosen scene', () => {
    render(<App />);
    navigate('目录');
    const scenes = [...new Set(seedCards.map(card => card.scene))];
    for (const scene of scenes) expect(screen.getByRole('button', { name: `学习${scene}` })).toBeTruthy();
    const target = '服装 · 包装要求与发货物流';
    fireEvent.click(screen.getByRole('button', { name: `学习${target}` }));
    const allowed = seedCards.filter(card => card.scene === target).map(card => card.english);
    let previous = null;
    for (let index = 0; index < 6; index++) {
      const text = learningCard().querySelector('[lang="en"]').textContent;
      expect(allowed).toContain(text);
      expect(text).not.toBe(previous);
      previous = text;
      fireEvent.click(screen.getByRole('button', { name: /换一张，继续练习/ }));
    }
    expect(screen.getByRole('progressbar', { name: '当前场景进度' }).getAttribute('aria-valuetext')).toBe('已学会 0 句，共 16 句');
  });

  it('does not count revealing a card as learning, persists marking, and allows undo after remount', () => {
    const { unmount } = render(<App />);
    fireEvent.click(within(learningCard()).getByRole('button', { name: '查看翻译和例句' }));
    expect(screen.getByRole('progressbar', { name: '总学习进度' }).getAttribute('aria-valuetext')).toBe('已学会 0 句，共 184 句');
    fireEvent.click(screen.getByRole('button', { name: '标记当前话术为已学会' }));
    expect(records().learnedIds).toEqual([seedCards[0].id]);
    unmount();
    render(<App />);
    expect(screen.getByRole('progressbar', { name: '总学习进度' }).getAttribute('aria-valuetext')).toBe('已学会 1 句，共 184 句');
    fireEvent.click(screen.getByRole('button', { name: '取消当前话术的已学会标记' }));
    expect(records().learnedIds).toEqual([]);
  });

  it('persists favorites, reviews only saved cards, and handles removing the last card', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '收藏当前话术' }));
    expect(records().favoriteIds).toEqual([seedCards[0].id]);
    unmount();
    render(<App />);
    navigate('收藏');
    expect(screen.getByText(seedCards[0].english)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '开始收藏复习' }));
    expect(learningCard().textContent).toContain(seedCards[0].english);
    expect(screen.getByRole('button', { name: /换一张，继续练习/ }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '取消收藏当前话术' }));
    expect(screen.queryByRole('article', { name: '学习卡片' })).toBeNull();
    expect(screen.getByText('这里还没有可复习的话术')).toBeTruthy();
    expect(records().favoriteIds).toEqual([]);
    navigate('收藏');
    expect(screen.getByText('把想多练的句子留在这里')).toBeTruthy();
  });

  it('retains the selected scenario when marking cards and reports accurate scenario progress', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: '选择学习场景' }), { target: { value: '服装 · MOQ与起订量' } });
    fireEvent.click(screen.getByRole('button', { name: '标记当前话术为已学会' }));
    expect(screen.getByRole('progressbar', { name: '当前场景进度' }).getAttribute('aria-valuetext')).toBe('已学会 1 句，共 16 句');
    expect(screen.getByRole('combobox', { name: '选择学习场景' }).value).toBe('服装 · MOQ与起订量');
  });

  it('adds a custom scenario to the directory and studies its only card', () => {
    render(<App />);
    navigate('管理');
    fireEvent.change(screen.getByLabelText(/英文原文/), { target: { value: 'Could you confirm the artwork?' } });
    fireEvent.change(screen.getByLabelText(/中文翻译/), { target: { value: '可以确认图稿吗？' } });
    fireEvent.change(screen.getByLabelText(/适用场景/), { target: { value: '我的图稿确认' } });
    fireEvent.change(screen.getByLabelText(/实战例句/), { target: { value: 'Buyer: Is the print ready?\nSupplier: Could you confirm the artwork?' } });
    fireEvent.click(screen.getByRole('button', { name: '保存到词库' }));
    navigate('目录');
    fireEvent.click(screen.getByRole('button', { name: '学习我的图稿确认' }));
    expect(learningCard().textContent).toContain('Could you confirm the artwork?');
    expect(screen.getByRole('button', { name: /换一张，继续练习/ }).disabled).toBe(true);
  });

  it('keeps progress unchanged when storage writes fail', () => {
    render(<App />);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    fireEvent.click(screen.getByRole('button', { name: '标记当前话术为已学会' }));
    expect(screen.getByRole('alert').textContent).toContain('本次更改未生效');
    expect(screen.getByRole('progressbar', { name: '总学习进度' }).getAttribute('aria-valuetext')).toBe('已学会 0 句，共 184 句');
    expect(screen.getByRole('button', { name: '标记当前话术为已学会' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('preserves corrupt stored records and pauses changes instead of overwriting them', () => {
    localStorage.setItem(LEARNING_KEY, '{broken');
    render(<App />);
    expect(screen.getByRole('alert').textContent).toContain('学习记录读取失败');
    expect(screen.getByRole('button', { name: '收藏当前话术' }).disabled).toBe(true);
    expect(localStorage.getItem(LEARNING_KEY)).toBe('{broken');
    expect(screen.getByRole('button', { name: /换一张，继续练习/ }).disabled).toBe(false);
  });
});
