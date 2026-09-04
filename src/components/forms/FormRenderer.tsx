// src/components/forms/FormRenderer.tsx
// ============================================================
// AIMS — dynamic form renderer: schema-driven fields, required-field
// validation and conditional (show-when) logic. On submit the data is
// persisted (aims_form_submissions), the owning team is notified and
// the user is routed to the queue that reviews that form type.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormDefinition, FormField } from '@/config/forms';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { queueForModule, saveFormSubmission } from '@/lib/formSubmissions';

interface FormRendererProps {
  form: FormDefinition;
  onSubmit?: (data: Record<string, string>) => void;
  onClose?: () => void;
}

export function FormRenderer({ form, onSubmit, onClose }: FormRendererProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, addNotification } = useNotifications();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Conditional logic: a field renders only when its trigger field equals the expected value
  const fieldVisible = (field: FormField): boolean =>
    !field.showWhen || formData[field.showWhen.key] === field.showWhen.value;

  const visibleFields = (sectionIdx: number): FormField[] =>
    form.sections[sectionIdx].fields.filter(fieldVisible);

  const handleSubmit = () => {
    const missingFields = form.sections
      .flatMap((_section, idx) => visibleFields(idx).filter((f) => f.required && !formData[f.key]));

    if (missingFields.length > 0) {
      showToast({
        title: 'Missing Required Fields',
        message: `Please fill: ${missingFields.map((f) => f.label).join(', ')}`,
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    const queue = queueForModule(form.module);
    const submittedAt = new Date().toISOString();
    const submittedBy = user?.name ?? 'Staff member';

    // 1) Save the submission
    saveFormSubmission({
      code: form.code,
      title: form.title,
      module: form.module,
      submittedBy,
      submittedAt,
      data: formData,
    });

    // 2) Notify the team that owns that queue
    queue?.recipients.forEach((r) => {
      addNotification({
        userId: r.userId,
        recipientName: r.name,
        title: `New Form — ${form.code}: ${form.title}`,
        message: `${submittedBy} submitted ${form.code} (${form.title}). Review it in the ${queue?.label ?? 'relevant module'}.`,
        type: 'approval',
        link: queue?.route ?? '/forms',
        actionUrl: queue?.route ?? '/forms',
      });
    });

    // 3) Route based on the form's module
    showToast({
      title: 'Form Submitted',
      message: `${form.code} saved. Sent to ${queue?.label ?? 'the relevant queue'} — the team has been notified.`,
      type: 'success',
    });
    onSubmit?.(formData);
    onClose?.();
    setSubmitting(false);
    if (queue?.route) navigate(queue.route);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key] || '';
    const commonClasses = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';

    switch (field.type) {
      case 'textarea':
        return <textarea rows={3} value={value} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} className={cn(commonClasses, 'resize-none')} />;
      case 'select':
        return (
          <select value={value} onChange={(e) => handleChange(field.key, e.target.value)} className={commonClasses}>
            <option value="">Select…</option>
            {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={value === 'true'} onChange={(e) => handleChange(field.key, e.target.checked ? 'true' : 'false')} className="rounded border-slate-300 accent-aims-navy" />
            {field.label}
          </label>
        );
      case 'number':
        return <input type="number" value={value} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} className={commonClasses} />;
      case 'date':
        return <input type="date" value={value} onChange={(e) => handleChange(field.key, e.target.value)} className={commonClasses} />;
      case 'signature':
        return <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center text-xs text-slate-400">Signature pad (click to sign)</div>;
      case 'auto':
        return <input type="text" value={value} readOnly placeholder="Auto-generated" className={cn(commonClasses, 'bg-slate-50 text-slate-500')} />;
      default:
        return <input type="text" value={value} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} className={commonClasses} />;
    }
  };

  const queue = queueForModule(form.module);

  return (
    <div className="space-y-5">
      <div className="bg-aims-navy rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">ARDHI | Form {form.code}</span>
          {form.confidentiality && <span className="text-[10px] font-bold text-aims-orange bg-aims-orange/20 px-2 py-0.5 rounded">{form.confidentiality}</span>}
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">{form.title}</h2>
        {form.instructions && <p className="text-xs text-white/70 mt-1">{form.instructions}</p>}
      </div>

      {form.sections.map((section, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-aims-navy/10 text-aims-navy flex items-center justify-center text-[10px] font-extrabold">{idx + 1}</span>
            {section.title}
          </h3>
          {section.description && <p className="text-xs text-slate-500 mb-3">{section.description}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.fields.filter(fieldVisible).map((field) => (
              <div key={field.key} className={field.type === 'textarea' || field.type === 'checkbox' ? 'md:col-span-2' : ''}>
                {field.type !== 'checkbox' && (
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                )}
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] text-slate-500 italic flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[13px] text-aims-navy">send</span>
          On submit: data saved and sent to the <strong>{queue?.label ?? 'relevant queue'}</strong> — the team is notified.
        </p>
        <div className="flex gap-2">
          {onClose && <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>}
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">check</span>{submitting ? 'Submitting…' : `Submit & Send to ${queue?.label ?? 'Queue'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
