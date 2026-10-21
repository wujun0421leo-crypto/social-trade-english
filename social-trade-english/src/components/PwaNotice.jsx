import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PwaNotice() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      setError('离线缓存暂未启用，联网时仍可正常学习。');
    },
  });

  if (!offlineReady && !needRefresh && !error) return null;

  function dismiss() {
    setOfflineReady(false);
    setNeedRefresh(false);
    setError('');
  }

  async function update() {
    setBusy(true);
    try { await updateServiceWorker(true); }
    catch { setError('更新失败，请联网后重试。'); }
    finally { setBusy(false); }
  }

  return (
    <aside aria-label="应用更新" className="mb-6 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-950">
      <p role="status">{error || (needRefresh ? '新版本已就绪，保存填写的内容后即可更新。' : '已支持离线学习，可以把 TradeTalk 添加到手机桌面。')}</p>
      <div className="mt-3 flex gap-4">
        {needRefresh && <button type="button" disabled={busy} onClick={update} className="min-h-11 font-semibold underline underline-offset-4">{busy ? '正在更新…' : '更新应用'}</button>}
        <button type="button" onClick={dismiss} className="min-h-11 text-teal-700">{needRefresh ? '稍后' : '知道了'}</button>
      </div>
    </aside>
  );
}
