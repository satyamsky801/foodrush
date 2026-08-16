import { Check, MapPin, Pencil, Star, Trash2 } from 'lucide-react';

const TYPE_STYLES = {
  Home: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  Work: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  Other: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

export default function AddressCard({ address, selected = false, onSelect, onEdit, onDelete, onSetDefault, showActions = true }) {
  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all ${
        selected
          ? 'border-brand-500 bg-brand-50/50 shadow-card dark:bg-brand-500/10'
          : 'border-zinc-200 bg-white hover:border-brand-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-brand-500/50'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${TYPE_STYLES[address.type] || TYPE_STYLES.Other}`}>
          {address.type}
        </span>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Star size={11} className="fill-amber-400 text-amber-400" /> Default
          </span>
        )}
      </div>

      <button onClick={onSelect} className="block w-full text-left" aria-label={`Select address ${address.label}`}>
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
          {address.name} <span className="font-normal text-zinc-400 dark:text-zinc-500">· {address.phone}</span>
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          <MapPin size={14} className="mt-0.5 shrink-0 text-brand-600" />
          {address.street}, {address.area}, {address.city} — {address.pincode}
          {address.landmark ? ` (near ${address.landmark})` : ''}
        </p>
      </button>

      {showActions && (
        <div className="mt-3 flex items-center gap-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {onSelect && (
            <button
              onClick={onSelect}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                selected
                  ? 'bg-brand-500 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-brand-100 hover:text-brand-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-brand-500/15 dark:hover:text-brand-400'
              }`}
            >
              <Check size={13} /> {selected ? 'Selected' : 'Deliver here'}
            </button>
          )}
          {!address.isDefault && onSetDefault && (
            <button onClick={() => onSetDefault(address.id)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
              Set default
            </button>
          )}
          <span className="ml-auto flex gap-1">
            {onEdit && (
              <button onClick={() => onEdit(address)} aria-label="Edit address" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(address.id)} aria-label="Delete address" className="rounded-full p-2 text-zinc-400 hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10">
                <Trash2 size={15} />
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
