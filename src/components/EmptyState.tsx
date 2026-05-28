import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-bugs' | 'no-results';
  onAddBug?: () => void;
}

export function EmptyState({ type, onAddBug }: EmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <svg
          width="120" height="100" viewBox="0 0 120 100"
          fill="none" xmlns="http://www.w3.org/2000/svg"
          className="mb-5 text-slate-300 dark:text-slate-600"
          aria-hidden="true"
        >
          {/* Magnifying glass */}
          <circle cx="50" cy="48" r="28" stroke="currentColor" strokeWidth="5" fill="none" />
          <line x1="71" y1="69" x2="100" y2="96" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* X inside glass */}
          <line x1="40" y1="38" x2="60" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="38" x2="40" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          No results found
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          Try adjusting your search terms or clearing some filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <svg
        width="130" height="110" viewBox="0 0 130 110"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        className="mb-5 text-slate-300 dark:text-slate-600"
        aria-hidden="true"
      >
        {/* Bug body */}
        <ellipse cx="65" cy="62" rx="26" ry="30" stroke="currentColor" strokeWidth="4.5" fill="none" />
        {/* Bug head */}
        <circle cx="65" cy="33" r="13" stroke="currentColor" strokeWidth="4.5" fill="none" />
        {/* Antennae */}
        <line x1="57" y1="22" x2="48" y2="12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="73" y1="22" x2="82" y2="12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        {/* Left legs */}
        <line x1="39" y1="52" x2="24" y2="46" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="39" y1="62" x2="22" y2="62" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="39" y1="72" x2="24" y2="78" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        {/* Right legs */}
        <line x1="91" y1="52" x2="106" y2="46" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="91" y1="62" x2="108" y2="62" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="91" y1="72" x2="106" y2="78" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        {/* Checkmark on body */}
        <polyline points="55,62 62,70 76,54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        All clear — no bugs yet!
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed mb-6">
        Start tracking issues when they appear. Press{' '}
        <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded font-mono">N</kbd>
        {' '}or click below.
      </p>
      {onAddBug && (
        <button
          type="button"
          onClick={onAddBug}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus size={15} /> Add First Bug
        </button>
      )}
    </div>
  );
}
