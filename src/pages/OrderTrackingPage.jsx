import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Bike, CheckCircle2, Clock, MapPin, Phone, ReceiptText, Star } from 'lucide-react';
import OrderStatus from '../components/OrderStatus';
import AppImage from '../components/AppImage';
import EmptyState from '../components/EmptyState';
import { useOrders, statusForOrder } from '../context/OrdersContext';
import { ORDER_STATUSES, STAGE_DURATION_MS } from '../data/constants';
import { formatINR, formatTime } from '../utils/format';
import { categoryEmoji } from '../utils/images';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const location = useLocation();
  const { getOrder } = useOrders();
  const justPlaced = location.state?.justPlaced;

  const [now, setNow] = useState(Date.now());

  // Ticker so the status timeline advances live (demo: one stage per 15s).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const order = getOrder(id);
  const status = statusForOrder(order);

  const progress = useMemo(() => {
    if (!order) return 0;
    const elapsed = Math.max(0, now - order.placedAt);
    return Math.min(100, (elapsed / (STAGE_DURATION_MS * (ORDER_STATUSES.length - 1))) * 100);
  }, [order, now]);

  if (!order) {
    return (
      <div className="container-app py-20">
        <EmptyState
          icon="🧾"
          title="Order not found"
          description="We couldn't find this order. It may have been placed from a different account."
          actionLabel="Go to my orders"
          actionTo="/orders"
        />
      </div>
    );
  }

  const delivered = status === 'delivered';
  const ETA = new Date(order.placedAt + STAGE_DURATION_MS * (ORDER_STATUSES.length - 1));

  return (
    <div className="container-app py-8">
      {justPlaced && (
        <div className="mb-6 flex animate-fade-up items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2 size={26} className="shrink-0 text-emerald-600" />
          <div>
            <p className="font-display text-base font-bold text-emerald-800">Order placed successfully!</p>
            <p className="text-sm text-emerald-700">Your food is being prepared. Track it live below. 🎉</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Order ID</p>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">#{order.id}</h1>
        </div>
        <Link to="/orders" className="btn-secondary px-4 py-2 text-sm">
          All orders
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Status timeline */}
          <OrderStatus status={status} />

          {/* Live progress strip */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                <Bike size={18} className="text-brand-600" /> Rider progress
              </h3>
              <span className="text-xs font-bold text-brand-600">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-ember-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
              <span
                className="absolute -top-2.5 text-xl transition-all duration-1000"
                style={{ left: `calc(${progress}% - 12px)` }}
                aria-hidden="true"
              >
                🛵
              </span>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              {delivered ? (
                <span className="font-semibold text-emerald-600">Delivered — enjoy your meal! 🎊</span>
              ) : (
                <>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{ORDER_STATUSES.find((s) => s.id === status)?.label}.</span>{' '}
                  Estimated arrival by <strong>{formatTime(ETA.getTime())}</strong> ({order.estimatedDelivery}).
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Demo note: this timeline advances one stage every 15 seconds so you can watch it live.
            </p>
          </div>

          {/* Delivery partner */}
          <div className="card p-5">
            <h3 className="mb-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
              {delivered ? 'Delivered by' : 'Your delivery partner'}
            </h3>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ember-500 font-display text-lg font-bold text-white">
                {order.deliveryPartner.name.split(' ').map((w) => w[0]).join('')}
              </span>
              <div className="flex-1">
                <p className="font-bold text-zinc-900 dark:text-zinc-50">{order.deliveryPartner.name}</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{order.deliveryPartner.rating}</span>
                  <span className="inline-flex items-center gap-1"><Bike size={12} />{order.deliveryPartner.vehicle}</span>
                </div>
              </div>
              <a
                href={`tel:${order.deliveryPartner.phone.replace(/\s/g, '')}`}
                className="btn-secondary h-11 w-11 rounded-full p-0"
                aria-label={`Call ${order.deliveryPartner.name}`}
              >
                <Phone size={17} />
              </a>
            </div>
          </div>

          {/* Delivery address */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
              <MapPin size={17} className="text-brand-600" /> Delivering to
            </h3>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{order.address.name}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {order.address.street}, {order.address.area}, {order.address.city} — {order.address.pincode}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Phone: {order.address.phone}</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
              <AppImage src={order.restaurantImage} alt={order.restaurantName} emoji="🍽️" className="h-12 w-12 rounded-xl" />
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-50">{order.restaurantName}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{order.estimatedDelivery}</p>
              </div>
            </div>
            <div className="space-y-3 p-5">
              {order.items.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <AppImage src={item.image} alt={item.name} emoji={categoryEmoji(item.category)} className="h-11 w-11 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.name}</p>
                    {item.customizations?.length > 0 && (
                      <p className="line-clamp-1 text-xs text-zinc-400 dark:text-zinc-500">{item.customizations.map((c) => c.optionName).join(' · ')}</p>
                    )}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">×{item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {formatINR((item.unitPrice + (item.addonTotal || 0) + (item.customTotal || 0)) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-zinc-200 p-5 text-sm dark:border-zinc-700">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400"><span>Item total</span><span>{formatINR(order.breakdown.total)}</span></div>
              <div className="mt-1.5 flex justify-between text-zinc-500 dark:text-zinc-400"><span>Delivery fee</span><span>{order.breakdown.deliveryFee === 0 ? 'FREE' : formatINR(order.breakdown.deliveryFee)}</span></div>
              <div className="mt-1.5 flex justify-between text-zinc-500 dark:text-zinc-400"><span>Taxes (GST)</span><span>{formatINR(order.breakdown.tax)}</span></div>
              {order.breakdown.discount > 0 && (
                <div className="mt-1.5 flex justify-between text-emerald-600"><span>{order.couponCode ? `Coupon (${order.couponCode})` : 'Discount'}</span><span>− {formatINR(order.breakdown.discount)}</span></div>
              )}
              <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 font-display text-base font-bold dark:border-zinc-800">
                <span className="flex items-center gap-1.5"><ReceiptText size={16} className="text-brand-600" /> Total</span>
                <span className="text-brand-600">{formatINR(order.breakdown.grandTotal)}</span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                <Clock size={12} /> Paid via {order.paymentMethod.toUpperCase()}
              </p>
            </div>
          </div>

          <Link to="/restaurants" className="btn-secondary w-full py-3">
            Order more food
          </Link>
        </div>
      </div>
    </div>
  );
}
