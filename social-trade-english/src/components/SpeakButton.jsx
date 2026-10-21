import { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';

export default function SpeakButton({ text }) {
  const [accent, setAccent] = useState('en-US');
  const { speaking, error, language, supported, play, stop } = useSpeech(text);
  const usedFallback = language && language.toLowerCase() !== accent.toLowerCase();

  return (
    <div className="max-w-full">
      <div className="flex items-center gap-2">
        <select aria-label="朗读口音" value={accent}
          onChange={event => { stop(); setAccent(event.target.value); }}
          className="min-h-11 rounded-xl border border-teal-100 bg-white px-2 text-sm text-teal-800">
          <option value="en-US">美音</option>
          <option value="en-GB">英音</option>
        </select>
        <button type="button" disabled={!supported} aria-pressed={speaking}
          aria-label={speaking ? '停止英文朗读' : '朗读英文原句'}
          onClick={() => speaking ? stop() : play(accent)}
          className="flex min-h-11 items-center gap-2 rounded-xl bg-teal-50 px-3 text-sm font-medium text-teal-800 hover:bg-teal-100">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5">
            {speaking ? <path d="M8 5v14M16 5v14" /> : <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>}
          </svg>
          {speaking ? '停止' : '朗读'}
        </button>
      </div>
      <span role="status" className="mt-1 block max-w-64 text-xs leading-relaxed text-stone-500">
        {!supported ? '此浏览器不支持语音朗读' : error || (usedFallback ? `当前设备使用${language.toLowerCase() === 'en-gb' ? '英音' : '美音'}` : '')}
      </span>
    </div>
  );
}
