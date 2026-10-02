import React, { useEffect, useRef, useState } from 'react';
import { Timestamp, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { Shield } from 'lucide-react';
import { PricingTier, SpecialPrices, SpecialPriceRanges, normalizePriceRanges, formatPriceRangeLabel, rangeKey, sanitizeSpecialPrices, sanitizeSpecialPriceRanges, initRangeOverrideForm } from '../lib/pricing';
import { useUser } from '../Context/AuthContext';

interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  location?: string;
  provider?: string;
  passwordReset?: boolean;
  role?: 'admin' | 'user';
  createdAt: Timestamp | { toDate: () => Date } | null;
  pricingTierId?: string | null;
  specialPrices?: SpecialPrices;
  specialPriceRanges?: SpecialPriceRanges;
  consultancySpecialAmount?: number | null;
}

interface Service {
  id: string;
  service_name: string;
  price: string | number;
  priceRanges?: { minAcres: number; maxAcres: number; price: number }[];
}

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onPasswordReset?: (userId: string) => void;
  onUserUpdated?: (userId: string, patch: Partial<User>) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  onClose,
  onPasswordReset,
  onUserUpdated,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [resetInProgress, setResetInProgress] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pricingTierId, setPricingTierId] = useState(user.pricingTierId || '');
  const [specialPrices, setSpecialPrices] = useState<Record<string, string>>({});
  const [specialRangePrices, setSpecialRangePrices] = useState<Record<string, Record<string, string>>>({});
  const [consultancySpecialAmount, setConsultancySpecialAmount] = useState(
    user.consultancySpecialAmount != null ? String(user.consultancySpecialAmount) : ''
  );
  const [savingPricing, setSavingPricing] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const { user: currentAdmin } = useUser();
  const isAdmin = user.role === 'admin';
  const isSelf = currentAdmin?.uid === user.uid;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const loadPricingData = async () => {
      setLoadingPricing(true);
      try {
        const [tiersSnap, servicesSnap] = await Promise.all([
          getDocs(collection(db, 'pricingTiers')),
          getDocs(collection(db, 'ServiceList')),
        ]);

        const tiersData = tiersSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || '',
            active: data.active !== false,
            prices: data.prices || {},
            priceRanges: data.priceRanges || {},
            consultancyAmount: data.consultancyAmount ?? null,
          } as PricingTier;
        });
        tiersData.sort((a, b) => a.name.localeCompare(b.name));
        setTiers(tiersData);

        const servicesData = servicesSnap.docs.map((d) => ({
          id: d.id,
          service_name: d.data().service_name || 'Untitled',
          price: d.data().price ?? 0,
          priceRanges: d.data().priceRanges,
        }));
        setServices(servicesData);

        const existing = user.specialPrices || {};
        setSpecialPrices(
          Object.fromEntries(
            servicesData.map((s) => [
              s.id,
              normalizePriceRanges(s.priceRanges).length
                ? ''
                : existing[s.id] !== undefined && existing[s.id] !== null
                  ? String(existing[s.id])
                  : '',
            ])
          )
        );
        setSpecialRangePrices(
          initRangeOverrideForm(servicesData, user.specialPriceRanges)
        );
      } catch (error) {
        console.error('Error loading pricing data:', error);
        toast.error('Failed to load pricing options');
      } finally {
        setLoadingPricing(false);
      }
    };

    void loadPricingData();
  }, [user.specialPrices, user.specialPriceRanges]);

  const handleSavePricing = async () => {
    const prices = sanitizeSpecialPrices(specialPrices);
    const catalogByService = Object.fromEntries(
      services.map((service) => [service.id, normalizePriceRanges(service.priceRanges)])
    );
    const rangePrices = sanitizeSpecialPriceRanges(catalogByService, specialRangePrices);
    for (const service of services) {
      if (normalizePriceRanges(service.priceRanges).length) {
        delete prices[service.id];
      }
    }
    let consultancy: number | null = null;
    if (consultancySpecialAmount.trim() !== '') {
      const num = Number(consultancySpecialAmount);
      if (Number.isNaN(num) || num < 0) {
        toast.error('Invalid consultancy special amount');
        return;
      }
      consultancy = num;
    }

    setSavingPricing(true);
    try {
      const patch = {
        pricingTierId: pricingTierId || null,
        specialPrices: prices,
        specialPriceRanges: rangePrices,
        consultancySpecialAmount: consultancy,
      };
      await updateDoc(doc(db, 'users', user.uid), patch);
      onUserUpdated?.(user.uid, patch);
      toast.success('Special pricing saved');
    } catch (error) {
      console.error('Error saving user pricing:', error);
      toast.error('Failed to save special pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleResetPassword = async () => {
    setResetInProgress(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { passwordReset: true });
      setResetSuccess(true);
      onPasswordReset?.(user.uid);
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setResetInProgress(false);
    }
  };

  const handleRoleChange = async (makeAdmin: boolean) => {
    if (!makeAdmin && isSelf) {
      toast.error('You cannot remove your own admin access');
      return;
    }

    const action = makeAdmin ? 'promote this user to admin' : 'remove admin access from this user';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    setRoleUpdating(true);
    try {
      const patch = { role: (makeAdmin ? 'admin' : 'user') as 'admin' | 'user' };
      await updateDoc(doc(db, 'users', user.uid), {
        ...patch,
        updatedAt: new Date(),
      });
      onUserUpdated?.(user.uid, patch);
      toast.success(makeAdmin ? 'User promoted to admin' : 'Admin access removed');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update admin access');
    } finally {
      setRoleUpdating(false);
    }
  };

  const isEmailProvider = user.provider === 'email';
  const selectedTier = tiers.find((t) => t.id === pricingTierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8 transform transition-all"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">User Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center">
              {user?.imageUrl && user.imageUrl !== '' ? (
                <img
                  src={user.imageUrl}
                  alt={`${user.name}'s profile`}
                  className="h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl text-gray-500">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              )}
              <p className="mt-2 text-sm text-gray-500">User ID: {user.uid.substring(0, 8)}...</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="text-sm font-medium">{user.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{user.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="text-sm font-medium">{user.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium">{user.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Authentication Provider</p>
                <p className="text-sm font-medium capitalize">{user.provider || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Created</p>
                <p className="text-sm font-medium">
                  {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleString() : 'N/A'}
                </p>
              </div>
              {isEmailProvider && (
                <div>
                  <p className="text-xs text-gray-500">Password Status</p>
                  <p className="text-sm font-medium">
                    {user.passwordReset ? 'Reset to Default' : 'Normal'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Account Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">UID</p>
                  <p className="text-sm font-medium break-all">{user.uid}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Type</p>
                  <p className="text-sm font-medium capitalize">
                    {user.provider === 'email' ? 'Email/Password' : user.provider}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <Shield className="w-3.5 h-3.5" />
                        Admin
                      </span>
                    ) : (
                      'Customer'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Admin Access</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isAdmin ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-600">
                    This user can sign in to the admin panel.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleRoleChange(false)}
                    disabled={roleUpdating || isSelf}
                    className="inline-flex justify-center rounded-md border border-red-200 shadow-sm px-4 py-2 bg-white text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 w-fit"
                  >
                    {roleUpdating ? 'Updating...' : 'Remove admin access'}
                  </button>
                  {isSelf && (
                    <p className="text-xs text-gray-400">You cannot remove your own admin access.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-600">
                    Promote this existing customer to admin. They keep the same login — no new account needed.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleRoleChange(true)}
                    disabled={roleUpdating}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 w-fit"
                  >
                    <Shield className="w-4 h-4" />
                    {roleUpdating ? 'Promoting...' : 'Make admin'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Special Pricing */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Special Pricing</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              {loadingPricing ? (
                <p className="text-sm text-gray-500">Loading pricing options...</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pricing tier</label>
                    <select
                      value={pricingTierId}
                      onChange={(e) => setPricingTierId(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">None (general prices)</option>
                      {tiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name}
                          {!tier.active ? ' (inactive)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedTier && (
                      <p className="text-xs text-gray-400 mt-1">
                        Tier sets {Object.keys(selectedTier.prices || {}).length} service
                        price(s)
                        {selectedTier.consultancyAmount != null
                          ? `; consultancy GHC ${selectedTier.consultancyAmount}`
                          : ''}
                        . Individual overrides below win when set.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Individual service prices (leave blank to use tier / general)
                    </p>
                    <div className="space-y-4">
                      {services.map((service) => {
                        const catalogRanges = normalizePriceRanges(service.priceRanges);
                        if (catalogRanges.length) {
                          return (
                            <div key={service.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{service.service_name}</p>
                                <p className="text-xs text-gray-400">Override per acre range (leave blank to use catalog / tier)</p>
                              </div>
                              {catalogRanges.map((band) => {
                                const key = rangeKey(band.minAcres, band.maxAcres);
                                const tierBand = selectedTier?.priceRanges?.[service.id]?.find(
                                  (row) => row.minAcres === band.minAcres && row.maxAcres === band.maxAcres
                                );
                                return (
                                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                    <p className="text-xs text-gray-600">{formatPriceRangeLabel(band)}</p>
                                    <p className="text-xs text-gray-400">Catalog: GHC {band.price}</p>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={specialRangePrices[service.id]?.[key] ?? ''}
                                      onChange={(e) =>
                                        setSpecialRangePrices((prev) => ({
                                          ...prev,
                                          [service.id]: {
                                            ...(prev[service.id] || {}),
                                            [key]: e.target.value,
                                          },
                                        }))
                                      }
                                      placeholder={
                                        tierBand
                                          ? `Tier: GHC ${tierBand.price}`
                                          : 'Override'
                                      }
                                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={service.id}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {service.service_name}
                              </p>
                              <p className="text-xs text-gray-400">General: GHC {service.price}</p>
                              {selectedTier?.prices?.[service.id] != null && (
                                <p className="text-xs text-red-600 font-medium">
                                  {selectedTier.name}: GHC {selectedTier.prices[service.id]}
                                </p>
                              )}
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={specialPrices[service.id] ?? ''}
                              onChange={(e) =>
                                setSpecialPrices((prev) => ({
                                  ...prev,
                                  [service.id]: e.target.value,
                                }))
                              }
                              placeholder={
                                selectedTier?.prices?.[service.id] != null
                                  ? `Uses ${selectedTier.name}: GHC ${selectedTier.prices[service.id]}`
                                  : 'Override'
                              }
                              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Consultancy special amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={consultancySpecialAmount}
                      onChange={(e) => setConsultancySpecialAmount(e.target.value)}
                      placeholder="Leave blank for tier / general"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSavePricing()}
                    disabled={savingPricing}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {savingPricing ? 'Saving...' : 'Save special pricing'}
                  </button>
                </>
              )}
            </div>
          </div>

          {isEmailProvider && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Account Actions</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col">
                  <p className="text-sm mb-2">
                    Reset this user's password to the default password.
                  </p>
                  {resetSuccess ? (
                    <div className="text-green-600 text-sm py-2">
                      Password has been reset successfully!
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-light text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-auto text-sm disabled:bg-blue-300"
                      onClick={handleResetPassword}
                      disabled={resetInProgress}
                    >
                      {resetInProgress ? 'Resetting...' : 'Reset Password'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-500 text-base font-light text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
