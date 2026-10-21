import { useState } from 'react';
import { loadCards, saveCards } from './storage';
import { loadLearning, saveLearning, toggleId, filterStudyCards, pickNextCard, getLearningStats, getSceneGroups } from './lib/learning';
import SpeakButton from './components/SpeakButton';
import PwaNotice from './components/PwaNotice';

const emptyForm = { english: '', chinese: '', scene: '', example: '' };
const fields = [
  ['english', '英文原文', '例如：What quantity do you have in mind?', 500],
  ['chinese', '中文翻译', '例如：你大概打算采购多少？', 500],
  ['scene', '适用场景', '选择已有场景，或输入新场景', 30],
  ['example', '实战例句', 'Buyer: What is your MOQ?\nSupplier: Our MOQ is 100 pieces per color.', 1500],
];
const descriptions = {
  '服装 · MOQ与起订量': '小单试产 · 按款按色 · 返单门槛',
  '服装 · 打样费用与时间': '样品报价 · 打样周期 · 产前样确认',
  '服装 · 面料与辅料确认': '成分克重 · 色样确认 · 印绣花辅料',
  '服装 · 尺寸表与版型修改': '测量方法 · 试身反馈 · 放码与公差',
  '服装 · 大货进度与尾期检验': '生产跟进 · 品质检查 · 第三方验货',
  '服装 · 付款方式与催尾款': '定金条件 · 付款确认 · 礼貌催尾款',
  '服装 · 包装要求与发货物流': '包装吊牌 · 装箱要求 · 出运交接',
  '破冰打招呼': '自然开场 · 了解客户 · 确认需求',
  '产品介绍与报价': '介绍卖点 · 清晰报价 · 说明交期',
  '讨价还价': '了解预算 · 调整方案 · 达成共识',
  '催单与付款': '温和跟进 · 确认订单 · 收款沟通',
  '发货与物流跟进': '物流追踪 · 延误说明 · 到货确认',
  '售后处理与要好评': '解决问题 · 补发退款 · 邀请评价',
};
const sceneName = scene => scene.replace(/^服装\s*·\s*/, '');

function Icon({ name, className = 'size-5', filled = false }) {
  const paths = {
    book: 'M4 4h6a3 3 0 0 1 2 2 3 3 0 0 1 2-2h6v15h-6a3 3 0 0 0-2 2 3 3 0 0 0-2-2H4V4Zm8 2v15',
    grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
    star: 'm12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L2.9 9.6l6.3-.9L12 3Z',
    check: 'm5 12 4 4L19 6',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    shuffle: 'M4 6h2c5 0 7 12 12 12h2m-4-4 4 4-4 4M4 18h2c2 0 4-2 6-6s4-6 6-6h2m-4-4 4 4-4 4',
    plus: 'M12 5v14M5 12h14',
    close: 'm6 6 12 12M6 18 18 6',
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] ?? paths.book} /></svg>;
}

function Progress({ cards, learnedIds, label = '学习进度' }) {
  const { count, total, percent } = getLearningStats(cards, learnedIds);
  return <div>
    <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="text-stone-500">{label}</span><span className="font-medium tabular-nums text-teal-900">{count} / {total} 句 · {percent}%</span></div>
    <div role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`已学会 ${count} 句，共 ${total} 句`} className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
  </div>;
}

function FlashCard({ card, open, onToggle, favorite, learned, onFavorite, onLearned, disabled }) {
  return <article aria-label="学习卡片" className="study-card reveal">
    <div className="mb-7 flex items-start justify-between gap-3">
      <span className="badge max-w-[70%]">{sceneName(card.scene)}</span>
      <button type="button" onClick={onFavorite} disabled={disabled} aria-pressed={favorite} aria-label={favorite ? '取消收藏当前话术' : '收藏当前话术'} className={`favorite-button ${favorite ? 'is-favorite' : ''}`}><Icon name="star" filled={favorite} /><span>{favorite ? '已收藏' : '收藏'}</span></button>
    </div>
    <button type="button" onClick={onToggle} aria-expanded={open} aria-label={open ? '收起翻译和例句' : '查看翻译和例句'} className="block w-full rounded-xl text-left">
      <span className="eyebrow mb-4 block">SAY IT WITH CONFIDENCE</span>
      <span lang="en" className="block text-[1.7rem] font-semibold leading-[1.45] tracking-tight text-stone-900 sm:text-[2rem]">{card.english}</span>
      {open ? <span className="reveal mt-6 block border-t border-teal-900/8 pt-6">
        <span className="block text-base leading-relaxed text-stone-600">{card.chinese}</span>
        <span className="example-box mt-5 block"><span className="eyebrow mb-3 block">实战对话 / IN CONTEXT</span><span lang="en" className="block whitespace-pre-line text-[15px] leading-7 text-teal-950">{card.example}</span></span>
        <span className="mt-5 block text-center text-xs text-stone-400">轻点收起翻译 ↑</span>
      </span> : <span className="mb-2 mt-10 flex items-center gap-2 text-sm text-stone-400"><span className="grid size-6 place-items-center rounded-full bg-teal-50 text-teal-700">↗</span>轻点查看翻译与实战例句</span>}
    </button>
    <div className="mt-7 flex flex-wrap items-start justify-between gap-3 border-t border-teal-900/8 pt-5">
      <SpeakButton text={card.english} />
      <button type="button" onClick={onLearned} disabled={disabled} aria-pressed={learned} aria-label={learned ? '取消当前话术的已学会标记' : '标记当前话术为已学会'} className={`learned-button ${learned ? 'is-learned' : ''}`}><Icon name="check" />{learned ? '已学会' : '标记已学会'}</button>
    </div>
  </article>;
}

function Directory({ cards, groups, learnedIds, onChoose }) {
  return <section aria-labelledby="directory-heading" className="space-y-6">
    <div><p className="eyebrow">FIND YOUR NEXT CONVERSATION</p><h1 id="directory-heading" className="page-title">先选场景，再练到熟。</h1><p className="page-description">从真实业务出发，让每次练习都有方向。</p></div>
    <button type="button" onClick={() => onChoose(null)} className="all-scenes-button"><span className="icon-tile"><Icon name="shuffle" /></span><span className="flex-1 text-left"><span className="block font-semibold">全部场景，随机练习</span><span className="mt-1 block text-xs text-teal-800/70">{groups.length} 个场景 · {cards.length} 条实用表达</span></span><Icon name="arrow" /></button>
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group, index) => <button key={group.scene} type="button" aria-label={`学习${group.scene}`} onClick={() => onChoose(group.scene)} className="scene-tile group">
        <div className="flex items-center justify-between"><span className="scene-number">{String(index + 1).padStart(2, '0')}</span><span className="text-xs text-stone-400">{group.total} 句 <span aria-hidden="true">↗</span></span></div>
        <h2 className="mb-2 mt-4 text-lg font-semibold tracking-tight text-stone-800">{sceneName(group.scene)}</h2>
        <p className="mb-5 text-xs leading-relaxed text-stone-500">{descriptions[group.scene] ?? '收藏你的业务经验，练习自己的沟通表达'}</p>
        <Progress cards={cards.filter(card => card.scene === group.scene)} learnedIds={learnedIds} label={`${sceneName(group.scene)}进度`} />
      </button>)}
    </div>
  </section>;
}

function Favorites({ cards, learnedIds, onRemove, onReview, onStart, onDirectory, disabled }) {
  return <section aria-labelledby="favorites-heading" className="space-y-6">
    <div><p className="eyebrow">KEEP THE WORDS YOU NEED</p><h1 id="favorites-heading" className="page-title">常用的句子，多练几次。</h1><p className="page-description">已收藏 {cards.length} 条，把容易忘的表达练成习惯。</p></div>
    {cards.length ? <>
      <div className="panel space-y-5"><Progress cards={cards} learnedIds={learnedIds} label="收藏复习进度" /><button type="button" onClick={onStart} className="primary w-full"><Icon name="shuffle" />开始收藏复习</button></div>
      <ul className="space-y-3">{cards.map(card => <li key={card.id} className="panel">
        <div className="mb-3 flex items-center justify-between gap-3"><span className="badge">{sceneName(card.scene)}</span><button type="button" disabled={disabled} onClick={() => onRemove(card.id)} aria-label={`取消收藏：${card.english}`} className="favorite-button is-favorite"><Icon name="star" filled /><span>取消收藏</span></button></div>
        <p lang="en" className="text-lg font-medium leading-relaxed text-stone-800">{card.english}</p><p className="mt-2 text-sm leading-relaxed text-stone-500">{card.chinese}</p>
        <div className="mt-4 flex items-center justify-between"><span className="text-xs text-stone-400">{learnedIds.includes(card.id) ? '✓ 已学会' : '待复习'}</span><button type="button" onClick={() => onReview(card.id)} className="text-action">练习这句 <Icon name="arrow" className="size-4" /></button></div>
      </li>)}</ul>
    </> : <div className="empty-state"><span className="empty-icon"><Icon name="star" className="size-8" /></span><h2 className="mt-5 text-lg font-semibold">把想多练的句子留在这里</h2><p className="mt-2 text-sm leading-relaxed text-stone-500">学习时轻点卡片右上角的星星，<br />以后就能在这里集中复习。</p><button type="button" onClick={onDirectory} className="primary mt-6">去目录选一句 <Icon name="arrow" /></button></div>}
  </section>;
}

function Manage({ cards, onAdd, readError }) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    setMessage('');
    if (Object.values(values).some(value => !value)) { setError('请填写所有字段，内容不能只有空格。'); return; }
    try { onAdd(values); setForm(emptyForm); setError(''); setMessage('已保存到词库，也已加入对应场景。'); }
    catch { setError('保存失败，请检查浏览器存储权限或可用空间；填写的内容已保留。'); }
  }
  return <section aria-labelledby="manage-heading" className="mx-auto max-w-2xl space-y-7">
    <div><p className="eyebrow">YOUR PERSONAL PHRASEBOOK</p><h1 id="manage-heading" className="page-title">积累你的沟通底气。</h1><p className="page-description">把今天用到的好表达，留给下一次对话。</p></div>
    <form onSubmit={submit} className="panel space-y-4">
      <h2 className="text-lg font-semibold">添加新话术</h2>
      {fields.map(([key, label, placeholder, maxLength]) => <label key={key} className="block text-sm font-medium text-stone-700">{label}<span className="ml-1 text-teal-700" aria-hidden="true">*</span>
        {key === 'scene' ? <input required list="scene-suggestions" value={form[key]} maxLength={maxLength} placeholder={placeholder} onChange={event => setForm({ ...form, [key]: event.target.value })} className="field" /> : <textarea required rows={key === 'example' ? 3 : 2} value={form[key]} maxLength={maxLength} placeholder={placeholder} onChange={event => setForm({ ...form, [key]: event.target.value })} className="field resize-y" />}
      </label>)}
      <datalist id="scene-suggestions">{[...new Set(cards.map(card => card.scene))].map(scene => <option key={scene} value={scene} />)}</datalist>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<p role="status" className="text-sm text-teal-700">{message}</p>
      <button disabled={Boolean(readError)} className="primary w-full" type="submit"><Icon name="plus" />保存到词库</button>
    </form>
    <section aria-labelledby="library-heading"><div className="mb-4 flex items-center justify-between"><h2 id="library-heading" className="text-lg font-semibold">我的词库</h2><span className="text-sm text-stone-500">{cards.length} 条话术</span></div><ul className="space-y-3">{cards.map(card => <li key={card.id} className="panel"><span className="badge">{sceneName(card.scene)}</span><p lang="en" className="mt-3 font-medium leading-relaxed">{card.english}</p><p className="mt-2 text-sm leading-relaxed text-stone-500">{card.chinese}</p><details className="mt-3 text-sm text-teal-700"><summary className="cursor-pointer">实战例句</summary><p lang="en" className="mt-2 whitespace-pre-line leading-relaxed text-stone-600">{card.example}</p></details></li>)}</ul>{!cards.length && <p className="empty-state">词库还是空的，添加第一条话术吧。</p>}</section>
  </section>;
}

export default function App() {
  const [initial] = useState(loadCards);
  const [initialLearning] = useState(loadLearning);
  const [cards, setCards] = useState(initial.cards);
  const [learning, setLearning] = useState({ favoriteIds: initialLearning.favoriteIds, learnedIds: initialLearning.learnedIds });
  const [saveError, setSaveError] = useState('');
  const [page, setPage] = useState('learn');
  const [selectedScene, setSelectedScene] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [currentId, setCurrentId] = useState(initial.cards[0]?.id);
  const [revealedId, setRevealedId] = useState(null);
  const groups = getSceneGroups(cards, learning.learnedIds);
  const favoriteCards = filterStudyCards(cards, { favoritesOnly: true, favoriteIds: learning.favoriteIds });
  const pool = filterStudyCards(cards, { scene: selectedScene, favoritesOnly, favoriteIds: learning.favoriteIds });
  const card = pool.find(item => item.id === currentId) ?? pool[0];
  const overall = getLearningStats(cards, learning.learnedIds);

  function navigate(target) { setPage(target); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function chooseScene(scene) {
    const scopedCards = filterStudyCards(cards, { scene });
    setSelectedScene(scene); setFavoritesOnly(false);
    setCurrentId(pickNextCard(scopedCards, null)?.id); setRevealedId(null); navigate('learn');
  }
  function startFavorites(id) {
    setSelectedScene(null); setFavoritesOnly(true);
    setCurrentId(typeof id === 'string' ? id : pickNextCard(favoriteCards, null)?.id);
    setRevealedId(null); navigate('learn');
  }
  function nextCard() { setCurrentId(pickNextCard(pool, card?.id)?.id); setRevealedId(null); }
  function updateLearning(key, id) {
    if (initialLearning.error) return;
    const next = { ...learning, [key]: toggleId(learning[key], id) };
    try { saveLearning(next); setLearning(next); setSaveError(''); }
    catch { setSaveError('学习记录保存失败，本次更改未生效。请检查浏览器存储权限或可用空间后重试。'); }
  }
  function addCard(values) {
    if (initial.error) throw new Error('Storage unavailable');
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const next = [{ id, ...values }, ...cards]; saveCards(next); setCards(next);
  }

  return <div className="app-shell">
    <header className="app-header"><a href="#" onClick={event => { event.preventDefault(); navigate('learn'); }} className="flex items-center gap-3"><span className="brand-mark" aria-hidden="true">t.</span><span className="text-lg font-bold tracking-tight text-teal-950">TradeTalk<span className="mt-0.5 block text-[10px] font-normal tracking-[0.12em] text-stone-500">服装外贸英语口袋卡</span></span></a><span className="header-note"><span className="size-1.5 rounded-full bg-teal-600" />每天一点，自然开口</span></header>
    <main id="main-content">
      <PwaNotice />
      {(initial.error || initialLearning.error || saveError) && <p role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">{initial.error || initialLearning.error || saveError}</p>}
      {page === 'learn' && <section aria-labelledby="learn-heading">
        <div className="hero-panel"><div><p className="eyebrow">SMALL PRACTICE. REAL CONVERSATIONS.</p><h1 id="learn-heading" className="page-title">把下一次对话，<br className="sm:hidden" />练得更从容。</h1><p className="page-description">选一个业务场景，练一句真正用得上的英语。</p></div><div className="hero-stats"><div><strong>{overall.count}<span> / {cards.length}</span></strong><span>累计学会</span></div><span className="stat-divider" /><div><strong>{favoriteCards.length}</strong><span>我的收藏</span></div></div><div className="mt-6 w-full"><Progress cards={cards} learnedIds={learning.learnedIds} label="总学习进度" /></div></div>
        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_238px]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">{favoritesOnly ? 'FAVORITES PRACTICE' : 'YOUR CURRENT SESSION'}</p><h2 className="mt-1 text-lg font-semibold text-stone-800">{favoritesOnly ? '收藏复习' : selectedScene ? sceneName(selectedScene) : '全部场景'}</h2></div>{favoritesOnly ? <button type="button" onClick={() => chooseScene(null)} className="text-action">返回全部场景 <Icon name="arrow" className="size-4" /></button> : <label className="scene-select-label"><Icon name="grid" className="size-4 shrink-0" /><select aria-label="选择学习场景" value={selectedScene ?? ''} onChange={event => chooseScene(event.target.value || null)}><option value="">全部场景 · {cards.length} 句</option>{groups.map(group => <option key={group.scene} value={group.scene}>{sceneName(group.scene)} · {group.total} 句</option>)}</select></label>}</div>
            {(selectedScene || favoritesOnly) && <div className="mb-5"><Progress cards={pool} learnedIds={learning.learnedIds} label="当前场景进度" /></div>}
            {card ? <>
              <FlashCard key={card.id} card={card} open={revealedId === card.id} onToggle={() => setRevealedId(revealedId === card.id ? null : card.id)} favorite={learning.favoriteIds.includes(card.id)} learned={learning.learnedIds.includes(card.id)} onFavorite={() => updateLearning('favoriteIds', card.id)} onLearned={() => updateLearning('learnedIds', card.id)} disabled={Boolean(initialLearning.error)} />
              <button type="button" onClick={nextCard} disabled={pool.length < 2} className="next-button mt-5"><span className="flex items-center gap-3"><Icon name="shuffle" />换一张，继续练习</span><Icon name="arrow" /></button>
              <p className="mt-4 text-center text-xs leading-relaxed text-stone-500">{pool.length < 2 ? '当前只有一句话术，可以展开、朗读并反复练习。' : `在当前${favoritesOnly ? '收藏' : '场景'}的 ${pool.length} 句话术中随机切换 · 不连续重复`}</p>
              <p className="mt-2 text-center text-xs text-stone-400">理解并能说出来后，点“标记已学会”记录进度。</p>
            </> : <div className="empty-state"><span className="empty-icon"><Icon name="star" className="size-8" /></span><h2 className="mt-4 text-lg font-semibold">这里还没有可复习的话术</h2><p className="mt-2 text-sm text-stone-500">收藏一些句子，或从其他场景开始练习。</p><button type="button" onClick={() => chooseScene(null)} className="primary mt-6">学习全部场景</button></div>}
          </div>
          <aside aria-label="学习场景快捷入口" className="hidden lg:block"><div className="sidebar-panel"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-stone-800">场景目录</h2><button type="button" onClick={() => navigate('directory')} className="text-xs text-teal-700">查看全部 ↗</button></div><div className="space-y-1">{groups.map(group => <button key={group.scene} type="button" aria-label={`切换到${group.scene}`} onClick={() => chooseScene(group.scene)} className={`sidebar-scene ${!favoritesOnly && selectedScene === group.scene ? 'is-active' : ''}`}><span className="min-w-0 flex-1">{sceneName(group.scene)}</span><span className="shrink-0 text-[10px] tabular-nums opacity-65">{group.count}/{group.total}</span></button>)}</div><button type="button" onClick={() => navigate('favorites')} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-900/10 text-xs font-medium text-teal-800"><Icon name="star" className="size-4" />去收藏夹复习 · {favoriteCards.length}</button></div></aside>
        </div>
      </section>}
      {page === 'directory' && <Directory cards={cards} groups={groups} learnedIds={learning.learnedIds} onChoose={chooseScene} />}
      {page === 'favorites' && <Favorites cards={favoriteCards} learnedIds={learning.learnedIds} onRemove={id => updateLearning('favoriteIds', id)} onReview={startFavorites} onStart={() => startFavorites()} onDirectory={() => navigate('directory')} disabled={Boolean(initialLearning.error)} />}
      {page === 'manage' && <Manage cards={cards} onAdd={addCard} readError={initial.error} />}
    </main>
    <nav aria-label="主导航" className="bottom-nav"><div className="nav-inner">{[['learn', '学习', 'book'], ['directory', '目录', 'grid'], ['favorites', '收藏', 'star'], ['manage', '管理', 'plus']].map(([key, label, icon]) => <button key={key} type="button" aria-current={page === key ? 'page' : undefined} onClick={() => navigate(key)} className={`nav-item ${page === key ? 'is-active' : ''}`}><span className="nav-icon"><Icon name={icon} filled={key === 'favorites' && page === key} /></span><span>{label}</span></button>)}</div></nav>
  </div>;
}
