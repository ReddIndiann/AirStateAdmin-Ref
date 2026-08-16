import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import {
  Tags,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ToggleLeft,
  ToggleRight,
  DollarSign,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { PricingTier as Tier, sanitizeSpecialPrices } from '../lib/pricing';

interface Service {
  id: string;
  service_name: string;
  price: string | number;
}

interface TierFormState {
  name: string;
  active: boolean;
  consultancyAmount: string;
  prices: Record<string, string>;
}

const emptyForm = (services: Service[]): TierFormState => ({
  name: '',
  active: true,
  consultancyAmount: '',
  prices: Object.fromEntries(services.map((s) => [s.id, ''])),
});

const PricingTiersPage: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [form, setForm] = useState<TierFormState>(emptyForm([]));
  const [saving, setSaving] = useState(false);

  const filteredTiers = useMemo(() => {
    if (!searchTerm.trim()) return tiers;
    const q = searchTerm.toLowerCase();
    return tiers.filter((t) => t.name?.toLowerCase().includes(q));
  }, [tiers, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tiersSnap, servicesSnap] = await Promise.all([
        getDocs(collection(db, 'pricingTiers')),
        getDocs(collection(db, 'ServiceList')),
      ]);

      const servicesData = servicesSnap.docs.map((d) => ({
        id: d.id,
        service_name: d.data().service_name || 'Untitled',
        price: d.data().price ?? 0,
      }));
      setServices(servicesData);

      const tiersData = tiersSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          active: data.active !== false,
          prices: data.prices || {},
          consultancyAmount: data.consultancyAmount ?? null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Tier;
      });

      tiersData.sort((a, b) => a.name.localeCompare(b.name));
      setTiers(tiersData);
    } catch (error) {
      console.error('Error loading pricing tiers:', error);
      toast.error('Failed to load pricing tiers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingTier(null);
    setForm(emptyForm(services));
    setIsModalOpen(true);
  };

  const openEdit = (tier: Tier) => {
    setEditingTier(tier);
    setForm({
      name: tier.name,
      active: tier.active,
      consultancyAmount:
        tier.consultancyAmount !== undefined && tier.consultancyAmount !== null
          ? String(tier.consultancyAmount)
          : '',
      prices: Object.fromEntries(
        services.map((s) => [
          s.id,
          tier.prices?.[s.id] !== undefined && tier.prices?.[s.id] !== null
            ? String(tier.prices[s.id])
            : '',
        ])
      ),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTier(null);
    setForm(emptyForm(services));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error('Tier name is required');
      return;
    }

    const prices = sanitizeSpecialPrices(form.prices);
    const consultancyRaw = form.consultancyAmount.trim();
    let consultancyAmount: number | null = null;
    if (consultancyRaw !== '') {
      const num = Number(consultancyRaw);
      if (Number.isNaN(num) || num < 0) {
        toast.error('Invalid consultancy amount');
        return;
      }
      consultancyAmount = num;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        active: form.active,
        prices,
        consultancyAmount,
        updatedAt: serverTimestamp(),
      };

      if (editingTier) {
        await updateDoc(doc(db, 'pricingTiers', editingTier.id), payload);
        toast.success('Tier updated');
      } else {
        await addDoc(collection(db, 'pricingTiers'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success('Tier created');
      }
      closeModal();
      await loadData();
    } catch (error) {
      console.error('Error saving tier:', error);
      toast.error('Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tier: Tier) => {
    try {
      await updateDoc(doc(db, 'pricingTiers', tier.id), {
        active: !tier.active,
        updatedAt: serverTimestamp(),
      });
      toast.success(tier.active ? 'Tier deactivated' : 'Tier activated');
      await loadData();
    } catch (error) {
      console.error('Error toggling tier:', error);
      toast.error('Failed to update tier');
    }
  };

  const handleDelete = async (tier: Tier) => {
    if (!window.confirm(`Delete pricing tier "${tier.name}"? Users on this tier will fall back to general prices.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'pricingTiers', tier.id));
      toast.success('Tier deleted');
      await loadData();
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast.error('Failed to delete tier');
    }
  };

  if (loading && tiers.length === 0 && services.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Tags className="w-6 h-6 text-red-600" />
                Pricing Tiers
              </h1>
              <p className="text-gray-600 mt-1">
                Define fixed special prices per service, then assign tiers to users.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Plus className="w-4 h-4" />
              New Tier
            </button>
          </div>

          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredTiers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchTerm ? 'No tiers match your search.' : 'No pricing tiers yet. Create one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Service prices</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Consultancy</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTiers.map((tier) => {
                    const pricedCount = Object.keys(tier.prices || {}).length;
                    return (
                      <tr key={tier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{tier.name}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              tier.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tier.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {pricedCount} of {services.length} set
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {tier.consultancyAmount != null
                            ? `GHC ${tier.consultancyAmount}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void toggleActive(tier)}
                              className="p-2 text-gray-500 hover:text-red-600"
                              title={tier.active ? 'Deactivate' : 'Activate'}
                            >
                              {tier.active ? (
                                <ToggleRight className="w-5 h-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(tier)}
                              className="p-2 text-gray-500 hover:text-blue-600"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(tier)}
                              className="p-2 text-gray-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTier ? 'Edit Pricing Tier' : 'New Pricing Tier'}
              </h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Partner Gold"
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Active
              </label>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Service prices (fixed GHC)</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Leave blank to keep the general catalog price for that service.
                </p>
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-amber-600">No services found in ServiceList.</p>
                  ) : (
                    services.map((service) => (
                      <div key={service.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{service.service_name}</p>
                          <p className="text-xs text-gray-400">General: GHC {service.price}</p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.prices[service.id] ?? ''}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              prices: { ...prev.prices, [service.id]: e.target.value },
                            }))
                          }
                          placeholder="Special price"
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultancy amount (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.consultancyAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, consultancyAmount: e.target.value }))}
                  placeholder="Leave blank for general amount"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTier ? 'Save changes' : 'Create tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingTiersPage;
