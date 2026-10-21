const normalizeLanguage = language => language.toLowerCase().replaceAll('_', '-');

export function selectEnglishVoice(voices, preferredLanguage = 'en-US') {
  const preferred = normalizeLanguage(preferredLanguage);
  const other = preferred === 'en-gb' ? 'en-us' : 'en-gb';
  for (const language of [preferred, other]) {
    const matches = voices.filter(voice => normalizeLanguage(voice.lang) === language);
    const selected = matches.find(voice => voice.localService) ?? matches[0];
    if (selected) return selected;
  }
  return null;
}

export function createSpeechPlayer({ synthesis, Utterance, onState = () => {} }) {
  let current = null;

  function stop(notify = true) {
    if (current) {
      current.onstart = current.onend = current.onerror = null;
      current = null;
      synthesis?.cancel();
    }
    if (notify) onState({ speaking: false, error: '', language: '' });
  }

  function play(text, preferredLanguage = 'en-US') {
    stop();
    if (!synthesis || !Utterance) {
      onState({ speaking: false, error: '当前浏览器不支持朗读，请使用 Safari、Chrome 或 Edge。', language: '' });
      return;
    }
    if (!text.trim()) return;
    try {
      const voices = synthesis.getVoices();
      const voice = selectEnglishVoice(voices, preferredLanguage);
      if (voices.length && !voice) {
        onState({ speaking: false, error: '本机未找到美式或英式英语音色，请先在系统语音设置中添加英语语音。', language: '' });
        return;
      }
      const utterance = new Utterance(text);
      // 部分浏览器首次加载时音色列表为空；用明确的英语语言请求系统音色。
      utterance.lang = voice?.lang ?? preferredLanguage;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      current = utterance; // 保留引用，避免移动端过早回收。
      const state = { speaking: true, error: '', language: utterance.lang };
      utterance.onstart = () => { if (current === utterance) onState(state); };
      utterance.onend = () => {
        if (current !== utterance) return;
        current = null;
        onState({ ...state, speaking: false });
      };
      utterance.onerror = event => {
        if (current !== utterance) return;
        current = null;
        const canceled = ['canceled', 'interrupted'].includes(event.error);
        onState({ ...state, speaking: false, error: canceled ? '' : '朗读未能完成，请检查设备音量、英语音色或网络后重试。' });
      };
      onState(state);
      // 在用户点击的调用链内调用 speak，兼容移动浏览器的播放限制。
      synthesis.speak(utterance);
    } catch {
      stop(false);
      onState({ speaking: false, error: '暂时无法启动朗读，请稍后再试。', language: '' });
    }
  }

  return { play, stop, dispose: () => stop(false) };
}
