import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Plus, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import AddressCard from '../components/AddressCard';
import PaymentCard from '../components/PaymentCard';
import CouponBox from '../components/CouponBox';
import PriceSummary from '../components/PriceSummary';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import AppImage from '../components/AppImage';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAddresses } from '../context/AddressContext';
import { useOrders } from '../context/OrdersContext';
import { useToast } from '../context/ToastContext';
import { restaurantApi } from '../api/restaurantApi';
import { couponApi } from '../api/couponApi';
import { mapRestaurant } from '../api/normalizers';
import { priceBreakdown } from '../utils/pricing';
import { formatINR } from '../utils/format';
import { categoryEmoji } from '../utils/images';

const EMPTY_FORM = {
  type: 'Home',
  name: '',
  phone: '',
  street: '',
  area: '',
  city: 'Bengaluru',
  pincode: '',
  landmark: '',
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { addresses, defaultAddress, addAddress, updateAddress, deleteAddress, setDefault } = useAddresses();
  const { placeOrder } = useOrders();
  const toast = useToast();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [couponCode, setCouponCode] = useState(location.state?.coupon || '');
  const [couponError, setCouponError] = useState('');
  const [method, setMethod] = useState('upi');
  const [paymentForm, setPaymentForm] = useState({});
  const [addressModal, setAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);

  // Live restaurant details for the delivery fee estimate + links.
  const restaurantFetch = useFetch(
    async () => {
      if (!cart.restaurantSlug) return null;
      const { restaurant } = await restaurantApi.getBySlug(cart.restaurantSlug);
      return mapRestaurant(restaurant);
    },
    [cart.restaurantSlug],
    { enabled: Boolean(cart.restaurantSlug) }
  );

  const restaurant = restaurantFetch.data || {
    id: cart.restaurantSlug,
    name: cart.restaurantName,
    image: cart.restaurantImage,
    deliveryFee: 0,
    freeDeliveryAbove: null,
  };

  const breakdown = useMemo(
    () => priceBreakdown(cart, restaurant, couponCode),
    [cart, restaurant, couponCode]
  );

  if (!isAuthenticated) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon="🔐"
          title="Login to checkout"
          description="Sign in to confirm your delivery address, choose a payment method and place your order."
          actionLabel="Login / Sign Up"
          actionTo="/login?redirect=/checkout"
        />
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Add some delicious food before heading to checkout."
          actionLabel="Browse restaurants"
          actionTo="/restaurants"
        />
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || defaultAddress;

  // Coupon codes are validated by the backend.
  const applyCoupon = async (code) => {
    setCouponError('');
    try {
      await couponApi.validate({
        code,
        itemTotal: breakdown.total,
        deliveryFee: breakdown.deliveryFee,
      });
      setCouponCode(code);
    } catch (e) {
      setCouponError(e.message);
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm(EMPTY_FORM);
    setFormError('');
    setAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({ ...EMPTY_FORM, ...addr });
    setFormError('');
    setAddressModal(true);
  };

  const saveAddress = async () => {
    const { type, name, phone, street, area, city, pincode } = addressForm;
    if (!name.trim() || !phone.trim() || !street.trim() || !area.trim() || !city.trim() || !pincode.trim()) {
      setFormError('Please fill in all the required fields.');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setFormError('Pincode should be a 6-digit number.');
      return;
    }
    const res = editingAddress
      ? await updateAddress(editingAddress.id, addressForm)
      : await addAddress(addressForm);
    if (res.ok) setAddressModal(false);
  };

  const placeOrderNow = async () => {
    // Validation
    if (!selectedAddress) {
      toast('Please add a delivery address.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(contactPhone.trim())) {
      toast('Please enter a valid 10-digit contact number.', 'error');
      return;
    }
    if (method === 'upi' && !String(paymentForm.upiId || '').includes('@')) {
      toast('Please enter a valid UPI ID (e.g. name@upi).', 'error');
      return;
    }
    if (method === 'card') {
      const { cardNumber, cardName, cardExpiry, cardCvv } = paymentForm;
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        toast('Please complete your card details.', 'error');
        return;
      }
    }

    setPlacing(true);
    try {
      // Only identifiers go to the server — it recomputes every price.
      const order = await placeOrder({
        restaurantId: cart.restaurantId,
        addressId: selectedAddress.id,
        paymentMethod: method,
        couponCode: couponCode || undefined,
        items: cart.items.map((it) => ({
          foodId: it.id,
          quantity: it.quantity,
          addons: (it.addons || []).map((a) => ({ id: a.id, name: a.name })),
          customizations: (it.customizations || []).map((c) => ({
            id: c.id,
            name: c.name,
            optionId: c.optionId,
            optionName: c.optionName,
          })),
        })),
      });

      clearCart(); // Only after the order exists in MongoDB.
      toast('Order placed successfully! 🎉');
      navigate(`/order/${order._id}`, { state: { justPlaced: true } });
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-app py-8">
      <Link
        to="/cart"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-300"
      >
        <ArrowLeft size={16} /> Back to cart
      </Link>
      <h1 className="mb-8 font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Delivery address */}
          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">1</span>
                Delivery address
              </h2>
              <button onClick={openAddAddress} className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
                <Plus size={15} /> Add new
              </button>
            </div>

            {addresses.length === 0 ? (
              <button
                onClick={openAddAddress}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 py-10 text-zinc-400 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-500"
              >
                <MapPin size={28} />
                <span className="text-sm font-semibold">No saved addresses — add your first one</span>
              </button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <AddressCard
                    key={a.id}
                    address={a}
                    selected={selectedAddress?.id === a.id}
                    onSelect={() => setSelectedAddressId(a.id)}
                    onEdit={openEditAddress}
                    onDelete={deleteAddress}
                    onSetDefault={setDefault}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Contact */}
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">2</span>
              Contact information
            </h2>
            <label className="label" htmlFor="contact-phone">Phone number</label>
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                id="contact-phone"
                className="input pl-10"
                inputMode="numeric"
                maxLength={10}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              We'll text you the live order updates on this number.
            </p>
          </section>

          {/* Payment */}
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">3</span>
              Payment method
            </h2>
            <PaymentCard method={method} onMethodChange={setMethod} form={paymentForm} onFormChange={setPaymentForm} />
          </section>
        </div>

        {/* Order summary */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <CouponBox
            appliedCode={couponCode}
            onApply={applyCoupon}
            onRemove={() => {
              setCouponCode('');
              setCouponError('');
            }}
            error={couponError}
          />

          <div className="card p-5">
            <h3 className="mb-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Order summary</h3>
            <div className="mb-4 max-h-56 space-y-3 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <AppImage
                    src={item.image}
                    alt={item.name}
                    emoji={categoryEmoji(item.category)}
                    className="h-12 w-12 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.name}</p>
                    {item.customizations?.length > 0 && (
                      <p className="line-clamp-1 text-xs text-zinc-400 dark:text-zinc-500">
                        {item.customizations.map((c) => c.optionName).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatINR((item.unitPrice + (item.addonTotal || 0) + (item.customTotal || 0)) * item.quantity)}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">×{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <PriceSummary breakdown={breakdown} />

            <button
              onClick={placeOrderNow}
              disabled={placing}
              className="btn-primary mt-5 w-full py-3.5 disabled:opacity-70"
            >
              {placing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Placing order…
                </span>
              ) : (
                <>
                  <UtensilsCrossed size={17} /> Place Order · {formatINR(breakdown.grandTotal)}
                </>
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-400 dark:text-zinc-500">
              <ShieldCheck size={14} className="text-emerald-500" />
              Demo payments — no real money is charged. The total is confirmed by the server.
            </p>
          </div>
        </div>
      </div>

      {/* Address modal */}
      <Modal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        title={editingAddress ? 'Edit address' : 'Add new address'}
        icon="📍"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {['Home', 'Work', 'Other'].map((t) => (
              <button
                key={t}
                onClick={() => setAddressForm((f) => ({ ...f, type: t }))}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                  addressForm.type === t
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'border-zinc-200 text-zinc-600 hover:border-brand-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand-500/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="addr-name">Full name *</label>
              <input id="addr-name" className="input" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} placeholder="Receiver's name" />
            </div>
            <div>
              <label className="label" htmlFor="addr-phone">Phone *</label>
              <input id="addr-phone" className="input" inputMode="numeric" maxLength={10} value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })} placeholder="10-digit number" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="addr-street">Street / House / Flat *</label>
            <input id="addr-street" className="input" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} placeholder="House no, street, building" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="addr-area">Area / Locality *</label>
              <input id="addr-area" className="input" value={addressForm.area} onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })} placeholder="e.g. Indiranagar" />
            </div>
            <div>
              <label className="label" htmlFor="addr-city">City *</label>
              <input id="addr-city" className="input" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="addr-pincode">Pincode *</label>
              <input id="addr-pincode" className="input" inputMode="numeric" maxLength={6} value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })} placeholder="560038" />
            </div>
            <div>
              <label className="label" htmlFor="addr-landmark">Landmark</label>
              <input id="addr-landmark" className="input" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          {formError && <p className="text-sm font-medium text-ember-500">{formError}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={saveAddress} className="btn-primary flex-1 py-3">
              {editingAddress ? 'Save changes' : 'Save address'}
            </button>
            <button onClick={() => setAddressModal(false)} className="btn-secondary px-5">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
