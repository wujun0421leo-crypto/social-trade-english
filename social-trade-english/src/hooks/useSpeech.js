import { useEffect, useRef, useState } from 'react';
import { createSpeechPlayer } from '../lib/speech';

export function useSpeech(text) {
  const player = useRef(null);
  const [state, setState] = useState({ speaking: false, error: '', language: '' });
  const supported = typeof window !== 'undefined' &&
    'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    const synthesis = supported ? window.speechSynthesis : null;
    const instance = createSpeechPlayer({
      synthesis,
      Utterance: supported ? window.SpeechSynthesisUtterance : null,
      onState: setState,
    });
    player.current = instance;
    // 提前触发音色发现；播放时重新 getVoices，使用最新的音色列表。
    const refreshVoices = () => synthesis?.getVoices();
    refreshVoices();
    synthesis?.addEventListener('voiceschanged', refreshVoices);
    return () => {
      synthesis?.removeEventListener('voiceschanged', refreshVoices);
      instance.dispose();
      player.current = null;
    };
  }, [supported]);

  useEffect(() => {
    player.current?.stop();
  }, [text]);

  return {
    ...state,
    supported,
    play: language => player.current?.play(text, language),
    stop: () => player.current?.stop(),
  };
}
