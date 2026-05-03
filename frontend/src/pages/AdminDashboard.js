import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  UsersIcon,
  HeartIcon,
  BuildingOfficeIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalRecipients: 0,
    totalHospitals: 0,
    activeRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    emergencyRequests: 0,
    systemHealth: 'healthy',
    serverUptime: '99.9%',
    responseTime: '120ms',
    databaseConnections: 5,
    activeSessions: 45
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'user_registration', user: 'John Doe', role: 'donor', time: '2 mins ago', status: 'success' },
    { id: 2, type: 'blood_request', user: 'Jane Smith', hospital: 'City Hospital', time: '5 mins ago', status: 'pending' },
    { id: 3, type: 'donation_completed', user: 'Mike Johnson', recipient: 'Emergency Patient', time: '10 mins ago', status: 'success' },
    { id: 4, type: 'system_alert', message: 'High traffic detected', time: '15 mins ago', status: 'warning' },
    { id: 5, type: 'user_registration', user: 'Sarah Wilson', role: 'recipient', time: '20 mins ago', status: 'success' }
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'emergency', message: 'Critical blood shortage at Regional Hospital', time: '5 mins ago', priority: 'high' },
    { id: 2, type: 'system', message: 'Database backup completed successfully', time: '1 hour ago', priority: 'low' },
    { id: 3, type: 'security', message: 'Unusual login pattern detected', time: '2 hours ago', priority: 'medium' }
  ]);

  const menuItems = [
    { id: 'overview', name: 'System Overview', icon: ChartBarIcon },
    { id: 'users', name: 'User Management', icon: UsersIcon },
    { id: 'requests', name: 'Blood Requests', icon: HeartIcon },
    { id: 'hospitals', name: 'Hospitals', icon: BuildingOfficeIcon },
    { id: 'analytics', name: 'Analytics', icon: DocumentTextIcon },
    { id: 'alerts', name: 'System Alerts', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon }
  ];

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalUsers.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+12%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Donors</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalDonors.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+8%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <HeartIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Requests</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.activeRequests}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-500">-3%</span>
                <span className="text-gray-500 ml-1">from yesterday</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-green-600">{systemMetrics.systemHealth}</p>
              <div className="flex items-center mt-2 text-sm">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">All systems operational</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* System Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Server Uptime</span>
              <span className="text-sm font-semibold text-gray-900">{systemMetrics.serverUptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-semibold text-gray-900">{systemMetrics.responseTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Connections</span>
              <span className="text-sm font-semibold text-gray-900">{systemMetrics.databaseConnections}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-semibold text-gray-900">{systemMetrics.activeSessions}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'user_registration' ? `${activity.user} registered as ${activity.role}` :
                       activity.type === 'blood_request' ? `Blood request by ${activity.user}` :
                       activity.type === 'donation_completed' ? `Donation completed by ${activity.user}` :
                       activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button className="bg-red-500 hover:bg-red-600">
          Add New User
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Recipients</p>
              <p className="text-xl font-bold text-gray-900">{systemMetrics.totalRecipients.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <HeartSolidIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Donors</p>
              <p className="text-xl font-bold text-gray-900">{systemMetrics.totalDonors.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hospitals</p>
              <p className="text-xl font-bold text-gray-900">{systemMetrics.totalHospitals.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* User List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">U{i}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">User {i}</div>
                        <div className="text-sm text-gray-500">user{i}@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      i % 3 === 0 ? 'bg-blue-100 text-blue-800' :
                      i % 3 === 1 ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {i % 3 === 0 ? 'Recipient' : i % 3 === 1 ? 'Donor' : 'Hospital'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      City {i}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      i % 2 === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {i % 2 === 0 ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {i} days ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="outline" size="sm" className="mr-2">View</Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      case 'users':
        return renderUserManagement();
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Cog6ToothIcon className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg">Section under development</p>
              <p className="text-sm mt-2">This section is being built and will be available soon.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-red-600">Admin Panel</h2>
            <p className="text-sm text-gray-600 mt-1">BloodNet+ Control System</p>
          </div>
          <nav className="mt-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeSection === item.id ? 'bg-red-50 border-r-4 border-red-500 text-red-600' : 'text-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and monitor the BloodNet+ platform</p>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {alerts.slice(0, 2).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg flex items-center justify-between ${
                  alert.priority === 'high' ? 'bg-red-50 border border-red-200' :
                  alert.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className={`h-5 w-5 mr-3 ${
                      alert.priority === 'high' ? 'text-red-600' :
                      alert.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        alert.priority === 'high' ? 'text-red-800' :
                        alert.priority === 'medium' ? 'text-yellow-800' : 'text-blue-800'
                      }`}>
                        {alert.message}
                      </p>
                      <p className={`text-xs ${
                        alert.priority === 'high' ? 'text-red-600' :
                        alert.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {alert.time}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
