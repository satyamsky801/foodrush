import { Banknote, CheckCircle2, CreditCard, Smartphone } from 'lucide-react';

const METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, hint: 'GPay · PhonePe · Paytm' },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, hint: 'Visa · Mastercard · RuPay' },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, hint: 'Pay when your order arrives' },
];

export default function PaymentCard({ method, onMethodChange, form, onFormChange }) {
  return (
    <div className="space-y-3">
      {METHODS.map(({ id, label, icon: Icon, hint }) => {
        const active = method === id;
        return (
          <div
            key={id}
            className={`rounded-2xl border transition-all ${
              active
                ? 'border-brand-500 bg-brand-50/50 shadow-card dark:bg-brand-500/10'
                : 'border-zinc-200 bg-white hover:border-brand-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-brand-500/50'
            }`}
          >
            <button
              onClick={() => onMethodChange(id)}
              aria-pressed={active}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <Icon size={20} className={active ? 'text-brand-600' : 'text-zinc-400 dark:text-zinc-500'} />
              <span className="flex-1">
                <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-50">{label}</span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  active ? 'border-brand-500 bg-brand-500 text-white' : 'border-zinc-300 text-transparent dark:border-zinc-600'
                }`}
              >
                <CheckCircle2 size={13} />
              </span>
            </button>

            {active && (
              <div className="animate-fade-in space-y-3 border-t border-brand-100 px-4 py-4 dark:border-brand-500/20">
                {id === 'upi' && (
                  <div>
                    <label className="label" htmlFor="upi-id">UPI ID</label>
                    <input
                      id="upi-id"
                      className="input"
                      placeholder="yourname@upi"
                      value={form.upiId || ''}
                      onChange={(e) => onFormChange({ ...form, upiId: e.target.value })}
                    />
                    <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">A collect request will be sent to this UPI ID.</p>
                  </div>
                )}

                {id === 'card' && (
                  <>
                    <div>
                      <label className="label" htmlFor="card-number">Card number</label>
                      <input
                        id="card-number"
                        className="input"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        value={form.cardNumber || ''}
                        onChange={(e) => onFormChange({ ...form, cardNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="card-name">Name on card</label>
                      <input
                        id="card-name"
                        className="input"
                        placeholder="Aarav Mehta"
                        value={form.cardName || ''}
                        onChange={(e) => onFormChange({ ...form, cardName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label" htmlFor="card-expiry">Expiry</label>
                        <input
                          id="card-expiry"
                          className="input"
                          placeholder="MM/YY"
                          value={form.cardExpiry || ''}
                          onChange={(e) => onFormChange({ ...form, cardExpiry: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="card-cvv">CVV</label>
                        <input
                          id="card-cvv"
                          className="input"
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="•••"
                          value={form.cardCvv || ''}
                          onChange={(e) => onFormChange({ ...form, cardCvv: e.target.value })}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Demo only — no real payment is processed.</p>
                  </>
                )}

                {id === 'cod' && (
                  <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <Banknote size={16} className="text-brand-600" />
                    Please keep {`₹`} cash ready. Exact change is appreciated!
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
