import { useCallback, useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { RoleBadge, AdminTable, inr } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import { initials, timeAgo } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['customer', 'restaurant', 'delivery', 'admin'];

export default function AdminUsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async (query) => {
    try {
      const res = await adminApi.allUsers(query ? { search: query } : {});
      setUsers(res.users);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => load(search.trim() || ''), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const changeRole = async (id, role) => {
    setBusy(`role-${id}`);
    try {
      await adminApi.updateUserRole(id, role);
      toast('Role updated');
      await load(search.trim() || '');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This removes their orders too.`)) return;
    setBusy(`del-${u.id}`);
    try {
      await adminApi.deleteUser(u.id);
      toast('User deleted');
      await load(search.trim() || '');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load users</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Users</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage accounts and roles across FoodRush.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="input w-64 pl-10"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!users ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <AdminTable
          head={['User', 'Contact', 'Role', 'Orders', 'Total spent', 'Joined', 'Actions']}
          empty={users.length === 0 ? 'No users found.' : ''}
          colSpan={7}
        >
          {users.map((u) => (
            <tr key={u.id} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ember-500 text-xs font-bold text-white">
                    {initials(u.name)}
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {u.name}
                      {String(u.id) === String(me?.id) && <span className="ml-1.5 text-xs font-bold text-brand-600">(you)</span>}
                    </p>
                    <p className="text-xs text-zinc-400">{u.provider === 'google' ? 'Google' : 'Email'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-zinc-700 dark:text-zinc-200">{u.email}</p>
                <p className="text-xs text-zinc-400">{u.phone}</p>
              </td>
              <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{u.orders}</td>
              <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-100">{inr(u.spent)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{timeAgo(new Date(u.createdAt).getTime())}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    disabled={busy === `role-${u.id}`}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="input w-32 py-1.5 text-xs"
                    aria-label={`Change role for ${u.name}`}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    onClick={() => removeUser(u)}
                    disabled={busy === `del-${u.id}` || String(u.id) === String(me?.id)}
                    aria-label={`Delete ${u.name}`}
                    className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 disabled:opacity-40 dark:hover:bg-ember-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
