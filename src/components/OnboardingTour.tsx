import React, { useState, useEffect } from 'react';
import {
  Bug, Plus, Search, LayoutDashboard, Kanban,
  ChevronRight, X, Sparkles,
} from 'lucide-react';

const ONBOARDING_KEY = 'bug-tracker-onboarded-v1';

interface Step {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  hint?: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Welcome to Bug Tracker!',
    description: 'A powerful tool to track, manage, and resolve bugs efficiently. This quick tour shows you the key features — takes less than a minute.',
    hint: undefined,
  },
  {
    icon: Bug,
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-500',
    title: 'Log Bugs Instantly',
    description: 'Click the "Add Bug" button in the header (or press N on your keyboard) to open the full bug form. Use "Quick" mode to log a title + severity in seconds.',
    hint: '⌨️  Shortcut: Press N anywhere to open the form',
  },
  {
    icon: Search,
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    iconColor: 'text-violet-600 dark:text-violet-400',
    title: 'Search & Filter',
    description: 'The search bar shows live results as you type. Set filters for status, severity, or assignee — then save that combination as a named preset for quick reuse.',
    hint: '⭐  Tip: Click "Save filter" to persist your current search',
  },
  {
    icon: LayoutDashboard,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: 'Analytics Dashboard',
    description: 'The dashboard shows live stats, severity breakdowns, a weekly trend chart, and a GitHub-style activity heatmap — all auto-updating as you add bugs.',
    hint: '📊  Scroll up to the dashboard to explore the charts',
  },
  {
    icon: Kanban,
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'List & Kanban Views',
    description: 'Switch between a sortable list and a Kanban board using the toggle in the header. On the Kanban board, drag cards between columns to update their status.',
    hint: '🖱️  Drag a card from "Open" to "In Progress" to try it',
  },
];

interface OnboardingTourProps {
  onFinish: () => void;
}

export function OnboardingTour({ onFinish }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Brief delay so the app renders first, then fade in
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onFinish();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleFinish();
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
      aria-label="Getting started tour"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleFinish}
      />

      {/* Tour card */}
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl animate-fade-slide-in overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full bg-blue-500 transition-all duration-500 ease-out w-[${Math.round(((step + 1) / STEPS.length) * 100)}%]`}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-300 ${i === step ? 'w-5 h-2 bg-blue-500' : i < step ? 'w-2 h-2 bg-blue-300 dark:bg-blue-700' : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Skip tour"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          <div className={`w-12 h-12 rounded-2xl ${current.iconBg} flex items-center justify-center mb-4`}>
            <Icon size={24} className={current.iconColor} />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
            {current.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {current.description}
          </p>

          {current.hint && (
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-700">
              {current.hint}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip tour
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            {step + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
          >
            {step === STEPS.length - 1 ? (
              <>Get started <Sparkles size={14} /></>
            ) : (
              <>Next <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Returns true if the user has NOT yet completed the onboarding tour */
export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(ONBOARDING_KEY);
}
