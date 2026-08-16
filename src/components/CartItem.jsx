import { Trash2 } from 'lucide-react';
import AppImage from './AppImage';
import Stepper from './Stepper';
import VegIndicator from './VegIndicator';
import { formatINR } from '../utils/format';
import { categoryEmoji } from '../utils/images';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const lineTotal = (item.unitPrice + (item.addonTotal || 0) + (item.customTotal || 0)) * item.quantity;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
      <AppImage
        src={item.image}
        alt={item.name}
        emoji={categoryEmoji(item.category)}
        className="h-20 w-20 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <VegIndicator veg={item.veg} size={10} />
            <h4 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</h4>
          </div>
          <p className="shrink-0 text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatINR(lineTotal)}</p>
        </div>

        {item.customizations?.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {item.customizations.map((c) => `${c.optionName}`).join(' · ')}
          </p>
        )}
        {item.addons?.length > 0 && (
          <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">+ {item.addons.map((a) => a.name).join(', ')}</p>
        )}
        {item.addonTotal > 0 && (
          <p className="text-xs font-medium text-brand-600">+{formatINR(item.addonTotal)} each</p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <Stepper quantity={item.quantity} onChange={(q) => onUpdateQuantity(item.key, q)} size="sm" />
          <button
            onClick={() => onRemove(item.key)}
            aria-label={`Remove ${item.name} from cart`}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-ember-500 transition-colors hover:bg-ember-50 dark:hover:bg-ember-500/10"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}
