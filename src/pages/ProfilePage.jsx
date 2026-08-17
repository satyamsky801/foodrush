import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CreditCard, Heart, LogOut, MapPin, Pencil, Plus, ReceiptText, Settings as SettingsIcon, Smartphone, Trash2, UserRound,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import AddressCard from '../components/AddressCard';
import RestaurantCard from '../components/RestaurantCard';
import FoodCard from '../components/FoodCard';
import AppImage from '../components/AppImage';
import { useAuth } from '../context/AuthContext';
import { useAddresses } from '../context/AddressContext';
import { useFavorites } from '../context/FavoritesContext';
import { useOrders } from '../context/OrdersContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/constants';
import { restaurantApi } from '../api/restaurantApi';
import { foodApi } from '../api/foodApi';
import { mapRestaurant, mapFood } from '../api/normalizers';
import { formatINR, initials, uid } from '../utils/format';

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'favourites', label: 'Favourites', icon: Heart },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const EMPTY_ADDRESS = {
  type: 'Home',
  name: '',
  phone: '',
  street: '',
  area: '',
  city: 'Bengaluru',
  pincode: '',
  landmark: '',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefault } = useAddresses();
  const { favoriteRestaurants, favoriteFoods } = useFavorites();
  const { orders } = useOrders();
  const { settings, effectiveTheme, toggleTheme, updateSetting, toggleNotification } = useSettings();
  const toast = useToast();

  const [tab, setTab] = useState('profile');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });

  const [addressModal, setAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [addrError, setAddrError] = useState('');

  const [paymentMethods, setPaymentMethods] = useLocalStorage(STORAGE_KEYS.paymentMethods, []);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ type: 'upi', upiId: '', cardNumber: '', cardName: '' });

  // Favourite restaurants/foods resolve from the backend (they're stored as
  // restaurant slugs + food Mongo ids).
  const [favRestaurants, setFavRestaurants] = useState([]);
  const [favFoods, setFavFoods] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        favoriteRestaurants.map(async (slug) => {
          try {
            const { restaurant } = await restaurantApi.getBySlug(slug);
            return mapRestaurant(restaurant);
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) setFavRestaurants(results.filter(Boolean));
    })();
    return () => {
      cancelled = true;
    };
  }, [favoriteRestaurants]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        favoriteFoods.map(async (foodId) => {
          try {
            const { food } = await foodApi.getById(foodId);
            return mapFood(food, food.restaurant);
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) setFavFoods(results.filter(Boolean));
    })();
    return () => {
      cancelled = true;
    };
  }, [favoriteFoods]);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((s, o) => s + (o.breakdown?.grandTotal || 0), 0);
    return { orders: orders.length, spent: totalSpent, favourites: favoriteRestaurants.length + favoriteFoods.length };
  }, [orders, favoriteRestaurants, favoriteFoods]);

  if (!isAuthenticated || !user) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon="👤"
          title="Login to view your profile"
          description="Sign in to see your saved addresses, favourites, payment methods and order history."
          actionLabel="Login / Sign Up"
          actionTo="/login?redirect=/profile"
        />
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  const saveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast('Name cannot be empty.', 'error');
      return;
    }
    const res = await updateProfile({ name: profileForm.name.trim(), phone: profileForm.phone.trim() });
    if (res.ok) setEditingProfile(false);
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm(EMPTY_ADDRESS);
    setAddrError('');
    setAddressModal(true);
  };

  const openEditAddress = (a) => {
    setEditingAddress(a);
    setAddressForm({ ...EMPTY_ADDRESS, ...a });
    setAddrError('');
    setAddressModal(true);
  };

  const saveAddress = async () => {
    const { name, phone, street, area, city, pincode } = addressForm;
    if (!name.trim() || !phone.trim() || !street.trim() || !area.trim() || !pincode.trim()) {
      setAddrError('Please fill in all required fields.');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setAddrError('Pincode should be 6 digits.');
      return;
    }
    const res = editingAddress
      ? await updateAddress(editingAddress.id, addressForm)
      : await addAddress(addressForm);
    if (res.ok) setAddressModal(false);
  };

  const savePayment = () => {
    if (paymentForm.type === 'upi') {
      if (!String(paymentForm.upiId || '').includes('@')) {
        toast('Enter a valid UPI ID (name@bank).', 'error');
        return;
      }
      setPaymentMethods((prev) => [
        ...prev,
        { id: uid('pay_'), type: 'upi', label: 'UPI', detail: paymentForm.upiId },
      ]);
    } else {
      const digits = String(paymentForm.cardNumber || '').replace(/\D/g, '');
      if (digits.length < 12 || !paymentForm.cardName.trim()) {
        toast('Enter a valid card number and name.', 'error');
        return;
      }
      setPaymentMethods((prev) => [
        ...prev,
        { id: uid('pay_'), type: 'card', label: 'Card', detail: `•••• ${digits.slice(-4)} · ${paymentForm.cardName.trim()}` },
      ]);
    }
    setPaymentForm({ type: 'upi', upiId: '', cardNumber: '', cardName: '' });
    setPaymentModal(false);
    toast('Payment method saved 💳');
  };

  return (
    <div className="container-app py-8">
      {/* Header card */}
      <div className="card mb-6 flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ember-500 font-display text-3xl font-extrabold text-white shadow-lg">
          {initials(user.name)}
        </span>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{user.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {user.provider === 'google' ? 'Google account' : 'Email account'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditingProfile(true)} className="btn-secondary px-4 py-2 text-sm">
            <Pencil size={14} /> Edit
          </button>
          <button onClick={logout} className="btn-danger px-4 py-2 text-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      {settings.showOrderStats && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Orders', value: stats.orders, icon: ReceiptText },
            { label: 'Total spent', value: formatINR(stats.spent), icon: CreditCard },
            { label: 'Favourites', value: stats.favourites, icon: Heart },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold leading-tight text-zinc-900 dark:text-zinc-50">{value}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-zinc-100 bg-white p-1.5 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              tab === id
                ? 'bg-gradient-to-r from-brand-500 to-ember-500 text-white shadow-md'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {tab === 'profile' && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-5 sm:p-6">
            <h3 className="mb-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Account details</h3>
            <dl className="space-y-3 text-sm">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={user.phone || '—'} />
              <Row label="Member since" value={memberSince} />
            </dl>
            <button onClick={() => navigate('/orders')} className="btn-secondary mt-5 w-full py-2.5 text-sm">
              <ReceiptText size={15} /> View order history
            </button>
          </div>
          <div className="card p-5 sm:p-6">
            <h3 className="mb-3 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Recent orders</h3>
            {orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">No orders yet — go grab something tasty! 🍕</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((o) => (
                  <button
                    key={o._id}
                    onClick={() => navigate(`/order/${o._id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 p-3 text-left transition-colors hover:border-brand-300 dark:border-zinc-800 dark:hover:border-brand-500/50"
                  >
                    <AppImage src={o.restaurantImage} alt="" emoji="🍽️" className="h-11 w-11 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-zinc-800 dark:text-zinc-100">{o.restaurantName}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">#{o.id} · {formatINR(o.breakdown?.grandTotal || 0)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Addresses */}
      {tab === 'addresses' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Saved addresses ({addresses.length})</h3>
            <button onClick={openAddAddress} className="btn-primary px-4 py-2 text-sm">
              <Plus size={15} /> Add address
            </button>
          </div>
          {addresses.length === 0 ? (
            <EmptyState icon="📍" title="No saved addresses" description="Add an address to make checkout faster." actionLabel="Add your first address" onAction={openAddAddress} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((a) => (
                <AddressCard
                  key={a.id}
                  address={a}
                  onEdit={openEditAddress}
                  onDelete={deleteAddress}
                  onSetDefault={setDefault}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Favourites */}
      {tab === 'favourites' && (
        <div className="space-y-10">
          <div>
            <h3 className="mb-4 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Favourite restaurants ({favRestaurants.length})</h3>
            {favRestaurants.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {favRestaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                Tap the ♥ on any restaurant to save it here.
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-4 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Favourite dishes ({favFoods.length})</h3>
            {favFoods.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {favFoods.map((f) => <FoodCard key={f.id} food={f} showRestaurant />)}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                Tap the ♥ on any dish to save it here.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Payments */}
      {tab === 'payments' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Payment methods ({paymentMethods.length})</h3>
            <button onClick={() => setPaymentModal(true)} className="btn-primary px-4 py-2 text-sm">
              <Plus size={15} /> Add method
            </button>
          </div>
          {paymentMethods.length === 0 ? (
            <EmptyState icon="💳" title="No payment methods" description="Add a UPI ID or card for faster checkout." actionLabel="Add payment method" onAction={() => setPaymentModal(true)} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {paymentMethods.map((p) => (
                <div key={p.id} className="card flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                    {p.type === 'upi' ? <Smartphone size={18} /> : <CreditCard size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{p.label}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{p.detail}</p>
                  </div>
                  <button
                    onClick={() => setPaymentMethods((prev) => prev.filter((x) => x.id !== p.id))}
                    aria-label="Remove payment method"
                    className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-4">
          <div className="card flex items-center justify-between p-5">
            <div>
              <p className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50">Dark mode 🌙</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Switch between light and dark appearance.</p>
            </div>
            <Toggle checked={effectiveTheme === 'dark'} onChange={toggleTheme} label="Dark mode" />
          </div>

          <div className="card flex items-center justify-between p-5">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-50">Veg mode 🌱</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Hide non-vegetarian restaurants & dishes across the app.</p>
            </div>
            <Toggle checked={settings.vegMode} onChange={(v) => updateSetting('vegMode', v)} label="Veg mode" />
          </div>

          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50">
              <Bell size={17} className="text-brand-600" /> Notifications
            </h3>
            <div className="space-y-4">
              <SettingRow title="Email notifications" desc="Order updates and offers via email" checked={settings.notifications.email} onChange={() => toggleNotification('email')} />
              <SettingRow title="SMS alerts" desc="Order status updates on SMS" checked={settings.notifications.sms} onChange={() => toggleNotification('sms')} />
              <SettingRow title="Push notifications" desc="Live tracking and reorder reminders" checked={settings.notifications.push} onChange={() => toggleNotification('push')} />
            </div>
          </div>

          <div className="card flex items-center justify-between p-5">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-50">Order statistics</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Show order counts and spend on your profile.</p>
            </div>
            <Toggle checked={settings.showOrderStats} onChange={(v) => updateSetting('showOrderStats', v)} label="Order stats" />
          </div>
        </div>
      )}

      {/* Edit profile modal */}
      <Modal open={editingProfile} onClose={() => setEditingProfile(false)} title="Edit profile" icon="✏️">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="edit-name">Full name</label>
            <input id="edit-name" className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="edit-phone">Phone</label>
            <input id="edit-phone" className="input" inputMode="numeric" maxLength={10} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '') })} />
          </div>
          <button onClick={saveProfile} className="btn-primary w-full py-3">Save changes</button>
        </div>
      </Modal>

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
              <label className="label" htmlFor="p-addr-name">Full name *</label>
              <input id="p-addr-name" className="input" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-addr-phone">Phone *</label>
              <input id="p-addr-phone" className="input" inputMode="numeric" maxLength={10} value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="p-addr-street">Street / House / Flat *</label>
            <input id="p-addr-street" className="input" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="p-addr-area">Area *</label>
              <input id="p-addr-area" className="input" value={addressForm.area} onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="p-addr-city">City *</label>
              <input id="p-addr-city" className="input" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="p-addr-pincode">Pincode *</label>
              <input id="p-addr-pincode" className="input" inputMode="numeric" maxLength={6} value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div>
              <label className="label" htmlFor="p-addr-landmark">Landmark</label>
              <input id="p-addr-landmark" className="input" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} />
            </div>
          </div>
          {addrError && <p className="text-sm font-medium text-ember-500">{addrError}</p>}
          <button onClick={saveAddress} className="btn-primary w-full py-3">
            {editingAddress ? 'Save changes' : 'Save address'}
          </button>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Add payment method" icon="💳">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'upi', label: 'UPI' },
              { id: 'card', label: 'Card' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPaymentForm((f) => ({ ...f, type: id }))}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                  paymentForm.type === id
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'border-zinc-200 text-zinc-600 hover:border-brand-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand-500/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {paymentForm.type === 'upi' ? (
            <div>
              <label className="label" htmlFor="pay-upi">UPI ID</label>
              <input id="pay-upi" className="input" placeholder="yourname@upi" value={paymentForm.upiId} onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })} />
            </div>
          ) : (
            <>
              <div>
                <label className="label" htmlFor="pay-card-number">Card number</label>
                <input id="pay-card-number" className="input" inputMode="numeric" placeholder="1234 5678 9012 3456" value={paymentForm.cardNumber} onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="pay-card-name">Name on card</label>
                <input id="pay-card-name" className="input" placeholder="Aarav Mehta" value={paymentForm.cardName} onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })} />
              </div>
            </>
          )}
          <button onClick={savePayment} className="btn-primary w-full py-3">Save method</button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="truncate font-semibold text-zinc-800 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function SettingRow({ title, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
