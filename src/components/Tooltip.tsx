import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const isTop = position === 'top';
  return (
    <span className="relative group/tip inline-flex">
      {children}
      <span
        className={`
          absolute ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}
          left-1/2 -translate-x-1/2
          px-2.5 py-1.5 text-xs font-medium
          bg-slate-900 dark:bg-slate-700 text-white
          rounded-lg whitespace-nowrap shadow-lg
          pointer-events-none z-[60]
          opacity-0 group-hover/tip:opacity-100
          scale-95 group-hover/tip:scale-100
          transition-all duration-150
        `}
      >
        {text}
        <span
          className={`
            absolute left-1/2 -translate-x-1/2
            border-[5px] border-transparent
            ${isTop
              ? 'top-full border-t-slate-900 dark:border-t-slate-700'
              : 'bottom-full border-b-slate-900 dark:border-b-slate-700'}
          `}
        />
      </span>
    </span>
  );
}
