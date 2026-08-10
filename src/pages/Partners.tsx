import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import {
  Link2,
  UserPlus,
  Search,
  Copy,
  CheckCircle,
  X,
  Mail,
  User,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Partner {
  id: string;
  name: string;
  code: string;
  email?: string;
  active: boolean;
  link: string;
  createdAt?: Timestamp | { toDate: () => Date } | null;
}

interface PartnerStats {
  clicks: number;
  signups: number;
  pendingCommissions: number;
  approvedCommissions: number;
  pendingAmount: number;
}

const DEFAULT_CUSTOMER_APP_URL = 'https://airstatelaps.com';

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '') || DEFAULT_CUSTOMER_APP_URL;
}

function slugifyCode(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 32);
}

function buildPartnerLink(code: string, baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/?ref=${encodeURIComponent(code)}`;
}

const Partners: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [statsByPartner, setStatsByPartner] = useState<Record<string, PartnerStats>>({});
  const [customerAppUrl, setCustomerAppUrl] = useState(DEFAULT_CUSTOMER_APP_URL);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    code: '',
  });

  const filteredPartners = useMemo(() => {
    if (!searchTerm.trim()) return partners;
    const q = searchTerm.toLowerCase();
    return partners.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [partners, searchTerm]);

  useEffect(() => {
    void fetchPartnersAndStats();
  }, []);

  const fetchCustomerAppUrl = async (): Promise<string> => {
    try {
      const configSnap = await getDocs(query(collection(db, 'AdminConfig'), limit(1)));
      if (!configSnap.empty) {
        const url = configSnap.docs[0].data().customerAppUrl;
        if (typeof url === 'string' && url.trim()) {
          return normalizeBaseUrl(url);
        }
      }
    } catch (error) {
      console.error('Error loading customerAppUrl from AdminConfig:', error);
    }
    return DEFAULT_CUSTOMER_APP_URL;
  };

  const fetchPartnersAndStats = async () => {
    setLoading(true);
    try {
      const baseUrl = await fetchCustomerAppUrl();
      setCustomerAppUrl(baseUrl);

      const partnersSnap = await getDocs(collection(db, 'partners'));
      const partnersData = partnersSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Partner, 'id'>),
      }));

      partnersData.sort((a, b) => {
        const aDate = a.createdAt && 'toDate' in a.createdAt ? a.createdAt.toDate().getTime() : 0;
        const bDate = b.createdAt && 'toDate' in b.createdAt ? b.createdAt.toDate().getTime() : 0;
        return bDate - aDate;
      });

      setPartners(partnersData);

      const [clicksSnap, usersSnap, commissionsSnap] = await Promise.all([
        getDocs(collection(db, 'referral_clicks')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'commissions')),
      ]);

      const stats: Record<string, PartnerStats> = {};
      for (const p of partnersData) {
        stats[p.id] = {
          clicks: 0,
          signups: 0,
          pendingCommissions: 0,
          approvedCommissions: 0,
          pendingAmount: 0,
        };
      }

      clicksSnap.forEach((d) => {
        const partnerId = d.data().partnerId as string;
        if (stats[partnerId]) stats[partnerId].clicks += 1;
      });

      usersSnap.forEach((d) => {
        const partnerId = d.data().referredBy as string | undefined;
        if (partnerId && stats[partnerId]) stats[partnerId].signups += 1;
      });

      commissionsSnap.forEach((d) => {
        const data = d.data();
        const partnerId = data.partnerId as string;
        if (!partnerId || !stats[partnerId]) return;
        if (data.status === 'pending') {
          stats[partnerId].pendingCommissions += 1;
          stats[partnerId].pendingAmount += Number(data.commissionAmount) || 0;
        } else if (data.status === 'approved' || data.status === 'paid') {
          stats[partnerId].approvedCommissions += 1;
        }
      });

      setStatsByPartner(stats);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', email: '', code: '' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const email = formData.email.trim();
    let code = formData.code.trim().toLowerCase() || slugifyCode(name);

    if (!name) {
      toast.error('Partner name is required');
      return;
    }
    if (!code) {
      toast.error('Partner code is required');
      return;
    }
    if (!/^[a-z0-9]+$/.test(code)) {
      toast.error('Code must be letters and numbers only');
      return;
    }

    setLoading(true);
    try {
      const existing = await getDocs(
        query(collection(db, 'partners'), where('code', '==', code))
      );
      if (!existing.empty) {
        toast.error('A partner with this code already exists');
        setLoading(false);
        return;
      }

      const baseUrl = await fetchCustomerAppUrl();
      setCustomerAppUrl(baseUrl);
      const link = buildPartnerLink(code, baseUrl);
      await addDoc(collection(db, 'partners'), {
        name,
        email: email || null,
        code,
        active: true,
        link,
        createdAt: serverTimestamp(),
      });

      toast.success('Partner created');
      handleCloseModal();
      await fetchPartnersAndStats();
    } catch (error) {
      console.error('Error creating partner:', error);
      toast.error('Failed to create partner');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (partner: Partner) => {
    try {
      await updateDoc(doc(db, 'partners', partner.id), {
        active: !partner.active,
        updatedAt: new Date(),
      });
      toast.success(partner.active ? 'Partner deactivated' : 'Partner activated');
      await fetchPartnersAndStats();
    } catch (error) {
      console.error('Error toggling partner:', error);
      toast.error('Failed to update partner');
    }
  };

  const copyLink = async (partner: Partner) => {
    const link = buildPartnerLink(partner.code, customerAppUrl);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(partner.id);
      toast.success('Referral link copied');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (loading && partners.length === 0) {
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
                <Link2 className="w-6 h-6 text-red-600" />
                Partners
              </h1>
              <p className="text-gray-600 mt-1">
                Create referral partners, copy links, and track clicks / signups / commissions
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add Partner
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search partners by name, code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredPartners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Link2 className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No partners found matching your search' : 'No partners yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code / Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Signups
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPartners.map((partner) => {
                    const stats = statsByPartner[partner.id] || {
                      clicks: 0,
                      signups: 0,
                      pendingCommissions: 0,
                      approvedCommissions: 0,
                      pendingAmount: 0,
                    };
                    const link = buildPartnerLink(partner.code, customerAppUrl);

                    return (
                      <tr key={partner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                          <div className="text-sm text-gray-500">{partner.email || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-gray-900">{partner.code}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate" title={link}>
                            {link}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stats.clicks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stats.signups}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            {stats.pendingCommissions} pending
                            {stats.pendingAmount > 0 ? ` (GHS ${stats.pendingAmount.toFixed(2)})` : ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stats.approvedCommissions} approved/paid
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              partner.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {partner.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyLink(partner)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                              title="Copy referral link"
                            >
                              {copiedId === partner.id ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => toggleActive(partner)}
                              className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded"
                              title={partner.active ? 'Deactivate' : 'Activate'}
                            >
                              {partner.active ? (
                                <ToggleRight className="w-5 h-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Add Partner</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        code: slugifyCode(name),
                      }));
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Partner name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="partner@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral code</label>
                <input
                  name="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  placeholder="partnercode"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link preview: {buildPartnerLink(formData.code || 'code', customerAppUrl)}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
