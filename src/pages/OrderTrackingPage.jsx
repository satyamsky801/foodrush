import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Bike, CheckCircle2, Clock, MapPin, Phone, ReceiptText, Star } from 'lucide-react';
import OrderStatus from '../components/OrderStatus';
import AppImage from '../components/AppImage';
import EmptyState from '../components/EmptyState';
import { useFetch } from '../hooks/useFetch';
import { orderApi } from '../api/orderApi';
import { reviewApi } from '../api/reviewApi';
import { mapOrder } from '../api/normalizers';
import { useToast } from '../context/ToastContext';
import { ORDER_STATUSES } from '../data/constants';
import { formatINR } from '../utils/format';
import { categoryEmoji } from '../utils/images';

const POLL_INTERVAL = 5000;

export default function OrderTrackingPage() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;
  const toast = useToast();

  // GET /api/orders/:id — status comes from the backend; poll for updates.
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const { order } = await orderApi.getById(id);
      return mapOrder(order);
    },
    [id]
  );

  useEffect(() => {
    if (error) return;
    const t = setInterval(() => refetch(), POLL_INTERVAL);
    return () => clearInterval(t);
  }, [error, refetch]);

  const order = data;

  // Review state (only shown once the order is delivered).
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const submitReview = async () => {
    if (!order) return;
    setSubmittingReview(true);
    try {
      await reviewApi.create({
        restaurantId: order.restaurantId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewed(true);
      toast('Thanks for your review! ⭐');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container-app py-20">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-64 rounded-3xl" />
          <div className="skeleton h-40 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-app py-20">
        {error ? (
          <EmptyState icon="📡" title="Couldn't load this order" description={error.message} actionLabel="Try again" onAction={refetch} />
        ) : (
          <EmptyState
            icon="🧾"
            title="Order not found"
            description="We couldn't find this order. It may have been placed from a different account."
            actionLabel="Go to my orders"
            actionTo="/orders"
          />
        )}
      </div>
    );
  }

  const delivered = order.orderStatus === 'delivered';
  const cancelled = order.orderStatus === 'cancelled';
  const statusIndex = ORDER_STATUSES.findIndex((s) => s.id === order.orderStatus);
  const progress = statusIndex === -1 ? 0 : (statusIndex / (ORDER_STATUSES.length - 1)) * 100;
  const partner = order.deliveryPartner;

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
          {cancelled ? (
            <div className="card border-red-200 p-6 text-center dark:border-red-500/30">
              <p className="text-3xl">😔</p>
              <p className="mt-2 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">This order was cancelled</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">No charges were made for this order.</p>
            </div>
          ) : (
            <OrderStatus status={order.orderStatus} />
          )}

          {/* Live progress strip */}
          {!cancelled && (
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
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                      {ORDER_STATUSES.find((s) => s.id === order.orderStatus)?.label}.
                    </span>{' '}
                    Estimated delivery in <strong>{order.estimatedDelivery || '30–40 min'}</strong>.
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Status updates come live from the kitchen — this page refreshes automatically.
              </p>
            </div>
          )}

          {/* Delivery partner */}
          {!cancelled && (
            <div className="card p-5">
              <h3 className="mb-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                {delivered ? 'Delivered by' : 'Your delivery partner'}
              </h3>
              {partner ? (
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ember-500 font-display text-lg font-bold text-white">
                    {partner.name.split(' ').map((w) => w[0]).join('')}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{partner.name}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {partner.rating != null && (
                        <span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{partner.rating}</span>
                      )}
                      {partner.vehicle && (
                        <span className="inline-flex items-center gap-1"><Bike size={12} />{partner.vehicle}</span>
                      )}
                    </div>
                  </div>
                  {partner.phone && (
                    <a
                      href={`tel:${partner.phone.replace(/\s/g, '')}`}
                      className="btn-secondary h-11 w-11 rounded-full p-0"
                      aria-label={`Call ${partner.name}`}
                    >
                      <Phone size={17} />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl dark:bg-zinc-800">
                    <Bike size={22} className="text-zinc-400" />
                  </span>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">Finding a delivery partner…</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">A rider will be assigned once your order is ready.</p>
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Review card */}
          {delivered && !reviewed && (
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                <Star size={18} className="fill-amber-400 text-amber-400" /> Rate this restaurant
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">How was your order from {order.restaurantName}?</p>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    className="p-1 transition-transform hover:scale-110 active:scale-90"
                  >
                    <Star
                      size={26}
                      className={`${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="input mt-3 min-h-20 resize-none"
                placeholder="Share your experience (optional)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="btn-primary mt-3 w-full py-3 disabled:opacity-70"
              >
                {submittingReview ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          )}
          {delivered && reviewed && (
            <div className="card flex items-center gap-3 border-emerald-200 p-5 dark:border-emerald-500/30">
              <CheckCircle2 size={22} className="text-emerald-600" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Thanks! Your review has been posted. ⭐</p>
            </div>
          )}
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
                <Clock size={12} /> Paid via {String(order.paymentMethod || '').toUpperCase()}
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
