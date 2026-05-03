import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { hospitalAPI } from '../services/api';
import * as XLSX from 'xlsx';
import {
  DocumentArrowDownIcon,
  ShareIcon,
  CalendarIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const SimpleHospitalReports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [timePeriod, setTimePeriod] = useState('week');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [timePeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await hospitalAPI.getInventoryReport({ dateRange: timePeriod });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      // Create simple Excel report
      const wb = XLSX.utils.book_new();

      // Simple summary sheet
      const summaryData = [
        { 'What': 'Hospital Name', 'Details': user?.hospitalName || 'Hospital' },
        { 'What': 'Report Date', 'Details': new Date().toLocaleDateString() },
        { 'What': 'Time Period', 'Details': getTimePeriodLabel(timePeriod) },
        { 'What': 'Total Blood Available', 'Details': `${reportData?.totalUnits || 0} units` },
        { 'What': 'Blood Requests Today', 'Details': `${reportData?.requestSummary?.totalReceived || 0} requests` },
        { 'What': 'People Helped Today', 'Details': `${reportData?.requestSummary?.accepted || 0} patients` }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Blood availability sheet
      const bloodData = reportData?.inventory?.map(item => ({
        'Blood Type': item.bloodGroup,
        'Available Units': item.unitsAvailable,
        'Status': getSimpleStatus(item.unitsAvailable, item.minThreshold),
        'Good For': getBloodTypeInfo(item.bloodGroup)
      })) || [];
      const wsBlood = XLSX.utils.json_to_sheet(bloodData);
      XLSX.utils.book_append_sheet(wb, wsBlood, 'Blood Types');

      XLSX.writeFile(wb, `blood-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getTimePeriodLabel = (period) => {
    const labels = {
      week: 'Last 7 days',
      month: 'Last 30 days',
      quarter: 'Last 3 months',
      year: 'Last 12 months'
    };
    return labels[period] || 'Last 7 days';
  };

  const getSimpleStatus = (available, minThreshold) => {
    if (available === 0) return '❌ Out of Stock';
    if (available <= minThreshold) return '⚠️ Low Stock';
    return '✅ Available';
  };

  const getBloodTypeInfo = (bloodGroup) => {
    const info = {
      'A+': 'Can give to A+, AB+',
      'A-': 'Can give to A+, A-, AB+, AB-',
      'B+': 'Can give to B+, AB+',
      'B-': 'Can give to B+, B-, AB+, AB-',
      'AB+': 'Can give to AB+ only',
      'AB-': 'Can give to AB+, AB-',
      'O+': 'Can give to all positive types',
      'O-': 'Can give to EVERYONE (Universal Donor)'
    };
    return info[bloodGroup] || 'Special blood type';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your blood report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blood Bank Report</h1>
            <p className="text-gray-600 mt-1">Easy-to-understand blood availability report</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Time Period</span>
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Download Report</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Hospital Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">{user?.hospitalName || 'Hospital'}</p>
              <p className="text-sm text-blue-700">Report for {getTimePeriodLabel(timePeriod)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Simple Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Time Period</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'week', label: 'Last 7 days' },
              { value: 'month', label: 'Last 30 days' },
              { value: 'quarter', label: 'Last 3 months' },
              { value: 'year', label: 'Last 12 months' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimePeriod(option.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timePeriod === option.value
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Simple Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Blood Available</h3>
            <p className="text-3xl font-bold text-red-600">{reportData?.totalUnits || 0}</p>
            <p className="text-sm text-gray-600 mt-1">units ready to save lives</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Blood Requests</h3>
            <p className="text-3xl font-bold text-blue-600">{reportData?.requestSummary?.totalReceived || 0}</p>
            <p className="text-sm text-gray-600 mt-1">people need blood</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">People Helped</h3>
            <p className="text-3xl font-bold text-green-600">{reportData?.requestSummary?.accepted || 0}</p>
            <p className="text-sm text-gray-600 mt-1">lives saved today</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Low Stock Alert</h3>
            <p className="text-3xl font-bold text-yellow-600">{reportData?.lowStockAlerts?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">types need more blood</p>
          </div>
        </motion.div>
      </div>

      {/* Simple Blood Type Availability */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Blood Type Availability</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData?.inventory?.map((item) => (
            <div key={item.bloodGroup} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mx-auto mb-3 ${
                  item.unitsAvailable === 0 ? 'bg-red-500' :
                  item.unitsAvailable <= item.minThreshold ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  {item.bloodGroup}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.bloodGroup} Blood</h3>
                <p className="text-2xl font-bold text-gray-800 mb-2">{item.unitsAvailable}</p>
                <p className="text-sm text-gray-600 mb-2">units available</p>
                <div className="text-xs text-gray-500">
                  <p className="font-medium">Good for:</p>
                  <p>{getBloodTypeInfo(item.bloodGroup)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Simple Low Stock Warnings */}
      {reportData?.lowStockAlerts?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-red-50 rounded-xl p-6 border border-red-200"
        >
          <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            Need More Blood!
          </h2>
          <div className="space-y-3">
            {reportData.lowStockAlerts.map((alert, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-600">
                      {alert.bloodGroup}
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">{alert.bloodGroup} Blood Type</p>
                      <p className="text-red-700">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{alert.currentUnits}</p>
                    <p className="text-sm text-red-600">units left</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Simple Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">What Happened This Week</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">Good News 🎉</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                {reportData?.requestSummary?.accepted || 0} people received blood
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                {reportData?.totalUnits || 0} units are available to help
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                Blood bank is ready for emergencies
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Blood Types Info 🩸</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li><strong>O-</strong> can give blood to anyone (Universal Donor)</li>
              <li><strong>AB+</strong> can receive blood from anyone (Universal Recipient)</li>
              <li><strong>O+</strong> is the most common blood type</li>
              <li><strong>AB-</strong> is the rarest blood type</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Simple Share Modal */}
      {showShareModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowShareModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Blood Report</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <ShareIcon className="h-4 w-4" />
                <span>Copy Link to Share</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Download and Share</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SimpleHospitalReports;
