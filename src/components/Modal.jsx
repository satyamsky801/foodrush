import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible modal: closes on backdrop click, Escape key, and shows a close
 * button. Locks body scroll while open.
 */
export default function Modal({ open, onClose, title, icon, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidth} animate-scale-in rounded-t-3xl bg-white p-6 shadow-float sm:rounded-3xl dark:bg-zinc-900`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {icon && <span aria-hidden="true">{icon}</span>}
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
