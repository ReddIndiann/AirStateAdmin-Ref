import React, { useState } from 'react';
import { Users, Package, MessageSquare } from 'lucide-react';
import AdminSupportList from './Support';
import AdminServiceManagement from './Services';
import ClientMessaging from './CustomerMessages';
// Define the tab types
type TabKey = 'support' | 'services' | 'messaging';

interface TabButtonProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

// Tab component for better organization
const TabButton: React.FC<TabButtonProps> = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
      ${active 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 hover:bg-gray-100'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// Main Dashboard component
const Tabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('support');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header with Tabs */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
            <div className="flex gap-2">
              <TabButton
                active={activeTab === 'support'}
                icon={Users}
                label="Support Tickets"
                onClick={() => setActiveTab('support')}
              />
              <TabButton
                active={activeTab === 'services'}
                icon={Package}
                label="Services"
                onClick={() => setActiveTab('services')}
              />
              <TabButton
                active={activeTab === 'messaging'}
                icon={MessageSquare}
                label="User Messaging"
                onClick={() => setActiveTab('messaging')}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'support' && <AdminSupportList />}
            {activeTab === 'services' && <AdminServiceManagement />}
            {activeTab === 'messaging' && <ClientMessaging />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tabs;
