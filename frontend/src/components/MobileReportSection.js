import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { hospitalAPI } from '../services/api';
import * as XLSX from 'xlsx';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  HeartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const MobileReportSection = ({ onBack }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState('week');

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await hospitalAPI.getInventoryReport({ dateRange: timePeriod });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    try {
      const wb = XLSX.utils.book_new();

      // Simple summary
      const summaryData = [
        { 'Metric': 'Total Blood Units', 'Value': `${reportData.totalUnits || 0} units` },
        { 'Metric': 'Requests Received', 'Value': `${reportData.requestSummary?.totalReceived || 0} requests` },
        { 'Metric': 'People Helped', 'Value': `${reportData.requestSummary?.accepted || 0} patients` },
        { 'Metric': 'Low Stock Types', 'Value': `${reportData.lowStockAlerts?.length || 0} types` }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Blood types
      const bloodData = reportData.inventory?.map(item => ({
        'Blood Type': item.bloodGroup,
        'Available': `${item.unitsAvailable} units`,
        'Status': item.unitsAvailable === 0 ? 'Out of Stock' : 
                item.unitsAvailable <= item.minThreshold ? 'Low Stock' : 'Available'
      })) || [];
      const wsBlood = XLSX.utils.json_to_sheet(bloodData);
      XLSX.utils.book_append_sheet(wb, wsBlood, 'Blood Types');

      XLSX.writeFile(wb, `blood-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getTimeLabel = (period) => {
    const labels = {
      week: 'Last 7 days',
      month: 'Last 30 days',
      quarter: 'Last 3 months',
      year: 'Last 12 months'
    };
    return labels[period] || 'Last 7 days';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold text-gray-900">Reports</h2>
        <div className="w-16"></div>
      </div>

      {/* Time Period Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Time Period</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'week', label: '7 Days' },
            { value: 'month', label: '30 Days' },
            { value: 'quarter', label: '3 Months' },
            { value: 'year', label: '12 Months' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimePeriod(option.value)}
              className={`py-2 px-4 rounded-lg transition-colors ${
                timePeriod === option.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Report Button */}
      <button
        onClick={generateReport}
        disabled={loading}
        className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Report'}
      </button>

      {/* Report Results */}
      {reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <HeartIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{reportData.totalUnits || 0}</p>
                <p className="text-sm text-gray-600">Blood Units</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{reportData.requestSummary?.accepted || 0}</p>
                <p className="text-sm text-gray-600">People Helped</p>
              </div>
            </div>
          </div>

          {/* Blood Types Summary */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Blood Types</h3>
            <div className="space-y-2">
              {reportData.inventory?.map((item) => (
                <div key={item.bloodGroup} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      item.unitsAvailable === 0 ? 'bg-red-500' :
                      item.unitsAvailable <= item.minThreshold ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      {item.bloodGroup}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.bloodGroup}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{item.unitsAvailable}</p>
                    <p className="text-xs text-gray-600">units</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          {reportData.lowStockAlerts?.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                Low Stock Alerts
              </h3>
              <div className="space-y-2">
                {reportData.lowStockAlerts.map((alert, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-red-900">{alert.bloodGroup} Blood</p>
                        <p className="text-sm text-red-700">{alert.message}</p>
                      </div>
                      <p className="text-lg font-bold text-red-600">{alert.currentUnits}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={downloadReport}
            className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
          >
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Download Excel Report
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default MobileReportSection;
