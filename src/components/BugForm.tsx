import React, { useState, useEffect } from 'react';
import { Bug, Severity, Status } from '../types/bug';
import { useBugs } from '../context/BugContext';
import { STATUS_CONFIGS } from '../lib/statusConfig';
import {
  X, ChevronRight, ChevronLeft, Zap, CheckCircle,
  FileText, Settings, Paperclip,
} from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface BugFormProps {
  bug?: Bug;
  onClose: () => void;
}

type FormMode = 'wizard' | 'quick';
type DescTab = 'write' | 'preview';

const DESCRIPTION_MAX = 1000;
const DRAFT_KEY = 'bug-form-draft';

const emptyForm = {
  title: '',
  description: '',
  severity: 'low' as Severity,
  status: 'new' as Status,
  assignedTo: '',
  screenshots: [] as string[],
  comments: [] as Bug['comments'],
  activityLogs: [] as Bug['activityLogs'],
};

const STEPS = [
  { label: 'Basic Info', icon: FileText },
  { label: 'Details', icon: Settings },
  { label: 'Attachments', icon: Paperclip },
];

export function BugForm({ bug, onClose }: BugFormProps) {
  const { dispatch } = useBugs();
  const isEdit = !!bug;

  const [mode, setMode] = useState<FormMode>('wizard');
  const [step, setStep] = useState(0);
  const [descTab, setDescTab] = useState<DescTab>('write');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const loadInitial = () => {
    if (bug) return { ...emptyForm, ...bug };
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...emptyForm, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return { ...emptyForm };
  };

  const [formData, setFormData] = useState(loadInitial);
  const [hasDraft, setHasDraft] = useState(() => !bug && !!localStorage.getItem(DRAFT_KEY));

  // Auto-save draft whenever form changes
  useEffect(() => {
    if (isEdit) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEdit]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const update = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (touched.has(key)) setErrors(prev => ({ ...prev, [key]: validate(key, value as string) }));
  };

  const touch = (key: string) => {
    setTouched(prev => { const s = new Set(prev); s.add(key); return s; });
    setErrors(prev => ({ ...prev, [key]: validate(key, String((formData as Record<string, unknown>)[key] ?? '')) }));
  };

  const validate = (key: string, value: string): string => {
    if (key === 'title') {
      if (!value.trim()) return 'Title is required';
      if (value.trim().length < 5) return 'Must be at least 5 characters';
    }
    if (key === 'description') {
      if (!value.trim()) return 'Description is required';
      if (value.trim().length < 10) return 'Must be at least 10 characters';
    }
    if (key === 'assignedTo') {
      if (!value.trim()) return 'Assignee is required';
    }
    return '';
  };

  const validateFields = (fields: string[]): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched = new Set(touched);
    let ok = true;
    fields.forEach(f => {
      const val = String((formData as Record<string, unknown>)[f] ?? '');
      const err = validate(f, val);
      newErrors[f] = err;
      newTouched.add(f);
      if (err) ok = false;
    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    setTouched(newTouched);
    return ok;
  };

  const fieldsByStep: string[][] = [['title'], ['description', 'assignedTo'], []];

  const handleNext = () => {
    if (validateFields(fieldsByStep[step])) setStep(s => s + 1);
  };

  const submit = () => {
    const allOk = validateFields(['title', 'description', 'assignedTo']);
    if (!allOk) return;
    const now = new Date().toISOString();
    if (isEdit) {
      dispatch({ type: 'UPDATE_BUG', payload: { ...bug, ...formData, updatedAt: now } as Bug });
    } else {
      dispatch({ type: 'ADD_BUG', payload: { ...formData, id: crypto.randomUUID(), createdAt: now, updatedAt: now } as Bug });
    }
    clearDraft();
    onClose();
  };

  const quickAdd = () => {
    if (!validateFields(['title'])) return;
    const now = new Date().toISOString();
    dispatch({
      type: 'ADD_BUG',
      payload: {
        ...emptyForm,
        title: formData.title,
        severity: formData.severity,
        description: 'Quick-added — add details later.',
        assignedTo: 'Unassigned',
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      } as Bug,
    });
    clearDraft();
    onClose();
  };

  // Style helpers
  const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
  const baseInput = 'block w-full rounded-lg text-sm px-3 py-2.5 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
  const fieldCls = (key: string) =>
    `${baseInput} border ${errors[key] && touched.has(key) ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'}`;
  const errMsg = (key: string) =>
    errors[key] && touched.has(key)
      ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
      : null;

  const descLen = (formData.description || '').length;
  const descNearLimit = descLen > DESCRIPTION_MAX * 0.85;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto z-50 pt-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-2xl mb-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Bug' : mode === 'quick' ? 'Quick Add' : 'Add New Bug'}
            </h2>
            {!isEdit && (
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMode('wizard')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${mode === 'wizard' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Full Form
                </button>
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${mode === 'quick' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <Zap size={11} /> Quick
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasDraft && !isEdit && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                Draft restored
              </span>
            )}
            <button
              type="button"
              onClick={() => { clearDraft(); onClose(); }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Quick Add ── */}
        {mode === 'quick' && !isEdit && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Log a bug fast — fill in details later.</p>

            <div>
              <label className={labelCls}>Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={e => update('title', e.target.value)}
                onBlur={() => touch('title')}
                className={fieldCls('title')}
                placeholder="What went wrong?"
                autoFocus
              />
              {errMsg('title')}
            </div>

            <div>
              <label className={labelCls}>Severity</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as Severity[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update('severity', s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      formData.severity === s
                        ? s === 'high'
                          ? 'bg-red-500 border-red-500 text-white'
                          : s === 'medium'
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { clearDraft(); onClose(); }}
                className="flex-1 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={quickAdd}
                className="flex-1 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Zap size={14} /> Quick Add
              </button>
            </div>
          </div>
        )}

        {/* ── Wizard / Edit ── */}
        {(mode === 'wizard' || isEdit) && (
          <>
            {/* Step progress bar */}
            {!isEdit && (
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center">
                  {STEPS.map((s, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          i < step
                            ? 'bg-blue-600 text-white'
                            : i === step
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {i < step ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <span className={`mt-1 text-xs font-medium whitespace-nowrap ${i === step ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-colors ${i < step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 py-5 space-y-5">
              {/* Step 1 — Basic Info */}
              {(step === 0 || isEdit) && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Title <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => update('title', e.target.value)}
                      onBlur={() => touch('title')}
                      className={fieldCls('title')}
                      placeholder="Brief description of the bug"
                      autoFocus={!isEdit && step === 0}
                    />
                    {errMsg('title')}
                  </div>

                  <div className={isEdit ? 'grid grid-cols-2 gap-4' : ''}>
                    <div>
                      <label htmlFor="bug-severity" className={labelCls}>Severity</label>
                      <select
                        id="bug-severity"
                        value={formData.severity}
                        onChange={e => update('severity', e.target.value as Severity)}
                        className={fieldCls('severity')}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    {isEdit && (
                      <div>
                        <label htmlFor="bug-status" className={labelCls}>Status</label>
                        <select
                          id="bug-status"
                          value={formData.status}
                          onChange={e => update('status', e.target.value as Status)}
                          className={fieldCls('status')}
                        >
                          {STATUS_CONFIGS.map(cfg => (
                            <option key={cfg.status} value={cfg.status}>{cfg.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {!isEdit && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                      Status will be set to <strong className="text-slate-600 dark:text-slate-300">New</strong> — change it from the bug detail after creation.
                    </p>
                  )}
                </div>
              )}

              {/* Step 2 — Details */}
              {(step === 1 || isEdit) && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Description <span className="text-red-400">*</span>
                      </label>
                      <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setDescTab('write')}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${descTab === 'write' ? 'bg-slate-800 dark:bg-slate-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setDescTab('preview')}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${descTab === 'preview' ? 'bg-slate-800 dark:bg-slate-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>

                    {descTab === 'write' ? (
                      <div>
                        <textarea
                          value={formData.description}
                          onChange={e => {
                            if (e.target.value.length <= DESCRIPTION_MAX)
                              update('description', e.target.value);
                          }}
                          onBlur={() => touch('description')}
                          className={`${fieldCls('description')} resize-none`}
                          rows={5}
                          placeholder="Steps to reproduce, expected vs actual behavior..."
                        />
                        <div className="flex items-center justify-between mt-1">
                          <div>{errMsg('description')}</div>
                          <span className={`text-xs tabular-nums ${descNearLimit ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
                            {descLen}/{DESCRIPTION_MAX}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={`min-h-[128px] rounded-lg border ${errors['description'] && touched.has('description') ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed`}>
                        {formData.description?.trim()
                          ? formData.description
                          : <span className="text-slate-400 italic">Nothing to preview yet…</span>
                        }
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Assigned To <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={e => update('assignedTo', e.target.value)}
                      onBlur={() => touch('assignedTo')}
                      className={fieldCls('assignedTo')}
                      placeholder="Team member name"
                    />
                    {errMsg('assignedTo')}
                  </div>
                </div>
              )}

              {/* Step 3 — Attachments */}
              {(step === 2 || isEdit) && (
                <div>
                  <label className={`${labelCls} mb-2`}>Screenshots</label>
                  <ImageUpload
                    images={formData.screenshots || []}
                    onImagesChange={shots => update('screenshots', shots)}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 rounded-b-2xl">
              {isEdit ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Update Bug
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={step === 0 ? () => { clearDraft(); onClose(); } : () => setStep(s => s - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {step === 0 ? 'Cancel' : <><ChevronLeft size={14} /> Back</>}
                  </button>

                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {step + 1} / {STEPS.length} · auto-saved
                  </span>

                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submit}
                      className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle size={14} /> Add Bug
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
