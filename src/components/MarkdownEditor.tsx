import React, { useRef, useState, useEffect } from 'react';
import { marked } from 'marked';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Code, FileCode, Quote, Link, Minus,
} from 'lucide-react';

marked.use({ gfm: true, breaks: true });

type ToolAction =
  | 'bold' | 'italic' | 'strikethrough'
  | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol'
  | 'code' | 'codeblock' | 'blockquote'
  | 'link' | 'hr';

function applyMarkdown(
  ta: HTMLTextAreaElement,
  value: string,
  type: ToolAction,
): { newValue: string; ns: number; ne: number } {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const sel = value.substring(s, e);

  switch (type) {
    case 'bold': {
      const t = sel || 'bold text';
      return { newValue: value.slice(0, s) + `**${t}**` + value.slice(e), ns: s + 2, ne: s + 2 + t.length };
    }
    case 'italic': {
      const t = sel || 'italic text';
      return { newValue: value.slice(0, s) + `*${t}*` + value.slice(e), ns: s + 1, ne: s + 1 + t.length };
    }
    case 'strikethrough': {
      const t = sel || 'text';
      return { newValue: value.slice(0, s) + `~~${t}~~` + value.slice(e), ns: s + 2, ne: s + 2 + t.length };
    }
    case 'code': {
      const t = sel || 'code';
      return { newValue: value.slice(0, s) + '`' + t + '`' + value.slice(e), ns: s + 1, ne: s + 1 + t.length };
    }
    case 'codeblock': {
      const t = sel || 'code here';
      const pre = s > 0 && value[s - 1] !== '\n' ? '\n' : '';
      const insert = `${pre}\`\`\`\n${t}\n\`\`\`\n`;
      return { newValue: value.slice(0, s) + insert + value.slice(e), ns: s + pre.length + 4, ne: s + pre.length + 4 + t.length };
    }
    case 'h1': case 'h2': case 'h3': {
      const lvl = type === 'h1' ? 1 : type === 'h2' ? 2 : 3;
      const pfx = '#'.repeat(lvl) + ' ';
      const ls = value.lastIndexOf('\n', s - 1) + 1;
      const lePos = value.indexOf('\n', e);
      const le = lePos === -1 ? value.length : lePos;
      const line = value.substring(ls, le);
      const clean = line.replace(/^#{1,6}\s/, '');
      return { newValue: value.slice(0, ls) + pfx + clean + value.slice(le), ns: ls + pfx.length, ne: ls + pfx.length + clean.length };
    }
    case 'ul': {
      const lines = sel ? sel.split('\n') : ['list item'];
      const pre = s > 0 && value[s - 1] !== '\n' ? '\n' : '';
      const body = lines.map(l => `- ${l.replace(/^[-*+]\s/, '')}`).join('\n');
      const insert = pre + body;
      return { newValue: value.slice(0, s) + insert + value.slice(e), ns: s + pre.length, ne: s + insert.length };
    }
    case 'ol': {
      const lines = sel ? sel.split('\n') : ['list item'];
      const pre = s > 0 && value[s - 1] !== '\n' ? '\n' : '';
      const body = lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s/, '')}`).join('\n');
      const insert = pre + body;
      return { newValue: value.slice(0, s) + insert + value.slice(e), ns: s + pre.length, ne: s + insert.length };
    }
    case 'blockquote': {
      const lines = sel ? sel.split('\n') : ['quote text'];
      const pre = s > 0 && value[s - 1] !== '\n' ? '\n' : '';
      const body = lines.map(l => `> ${l.replace(/^>\s?/, '')}`).join('\n');
      const insert = pre + body;
      return { newValue: value.slice(0, s) + insert + value.slice(e), ns: s + pre.length, ne: s + insert.length };
    }
    case 'link': {
      const t = sel || 'link text';
      const insert = `[${t}](url)`;
      return { newValue: value.slice(0, s) + insert + value.slice(e), ns: s + 1 + t.length + 2, ne: s + 1 + t.length + 5 };
    }
    case 'hr': {
      const pre = s > 0 && value[s - 1] !== '\n' ? '\n' : '';
      const insert = `${pre}---\n`;
      return { newValue: value.slice(0, s) + insert + value.slice(e), ns: s + insert.length, ne: s + insert.length };
    }
  }
}

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  maxLength?: number;
  hasError?: boolean;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  value, onChange, onBlur,
  maxLength = 5000, hasError, placeholder, rows = 8,
}: MarkdownEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (tab === 'preview') {
      Promise.resolve(marked.parse(value || '')).then(setPreviewHtml);
    }
  }, [value, tab]);

  const apply = (type: ToolAction) => {
    if (!taRef.current) return;
    const { newValue, ns, ne } = applyMarkdown(taRef.current, value, type);
    const clamped = maxLength ? newValue.slice(0, maxLength) : newValue;
    onChange(clamped);
    requestAnimationFrame(() => {
      taRef.current?.focus();
      taRef.current?.setSelectionRange(ns, ne);
    });
  };

  const border = hasError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700';
  const btn = 'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors';
  const sep = <span className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-0.5 self-center flex-shrink-0" />;

  return (
    <div>
      {/* Tab bar + toolbar header */}
      <div className={`flex items-center justify-between px-2 py-1.5 border ${border} border-b-0 rounded-t-lg bg-slate-50 dark:bg-slate-800/50`}>

        {/* Markdown toolbar — write mode only */}
        {tab === 'write' ? (
          <div className="flex items-center flex-wrap gap-0.5">
            <button type="button" onClick={() => apply('bold')} className={btn} title="Bold"><Bold size={13} /></button>
            <button type="button" onClick={() => apply('italic')} className={btn} title="Italic"><Italic size={13} /></button>
            <button type="button" onClick={() => apply('strikethrough')} className={btn} title="Strikethrough"><Strikethrough size={13} /></button>
            {sep}
            <button type="button" onClick={() => apply('h1')} className={`${btn} text-[11px] font-bold px-1.5 min-w-[1.75rem]`} title="Heading 1">H1</button>
            <button type="button" onClick={() => apply('h2')} className={`${btn} text-[11px] font-bold px-1.5 min-w-[1.75rem]`} title="Heading 2">H2</button>
            <button type="button" onClick={() => apply('h3')} className={`${btn} text-[11px] font-bold px-1.5 min-w-[1.75rem]`} title="Heading 3">H3</button>
            {sep}
            <button type="button" onClick={() => apply('ul')} className={btn} title="Bullet list"><List size={13} /></button>
            <button type="button" onClick={() => apply('ol')} className={btn} title="Numbered list"><ListOrdered size={13} /></button>
            {sep}
            <button type="button" onClick={() => apply('code')} className={btn} title="Inline code"><Code size={13} /></button>
            <button type="button" onClick={() => apply('codeblock')} className={btn} title="Code block"><FileCode size={13} /></button>
            <button type="button" onClick={() => apply('blockquote')} className={btn} title="Blockquote"><Quote size={13} /></button>
            {sep}
            <button type="button" onClick={() => apply('link')} className={btn} title="Insert link"><Link size={13} /></button>
            <button type="button" onClick={() => apply('hr')} className={btn} title="Horizontal rule"><Minus size={13} /></button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Markdown rendered below</span>
        )}

        {/* Write / Preview toggle */}
        <div className="flex rounded border border-slate-200 dark:border-slate-600 overflow-hidden flex-shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${tab === 'write' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${tab === 'preview' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content area */}
      {tab === 'write' ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={e => {
            if (!maxLength || e.target.value.length <= maxLength) onChange(e.target.value);
          }}
          onBlur={onBlur}
          rows={rows}
          placeholder={placeholder}
          className={`block w-full rounded-b-lg text-sm px-3 py-2.5 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white border ${border} resize-none font-mono text-[13px] leading-relaxed`}
        />
      ) : (
        <div
          className={`min-h-[200px] rounded-b-lg border ${border} bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 overflow-auto markdown-preview`}
          dangerouslySetInnerHTML={value.trim() ? { __html: previewHtml } : undefined}
        >
          {!value.trim() && <span className="text-slate-400 dark:text-slate-500 italic text-sm">Nothing to preview yet…</span>}
        </div>
      )}

      {/* Character count */}
      <div className="flex justify-end mt-1">
        <span className={`text-xs tabular-nums ${maxLength && value.length > maxLength * 0.85 ? 'text-amber-500 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
          {value.length}{maxLength ? `/${maxLength}` : ''}
        </span>
      </div>
    </div>
  );
}
