import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentTextIcon,
  TrophyIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { certificateAPI } from '../services/api';

const CertificateGallery = ({ userId }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showFullCertificate, setShowFullCertificate] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, [userId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificateAPI.getMyCertificates();
      setCertificates(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (certificateId) => {
    const certificate = certificates.find(c => c._id === certificateId);
    setSelectedCertificate(certificate);
    setShowFullCertificate(true);
  };

  const handleShareCertificate = async (certificateId) => {
    try {
      await certificateAPI.shareCertificate(certificateId);
      // Update certificate in state
      setCertificates(prev => prev.map(cert => 
        cert._id === certificateId 
          ? { ...cert, isPublic: true, sharedOn: new Date() }
          : cert
      ));
    } catch (err) {
      console.error('Error sharing certificate:', err);
    }
  };

  const handleDownloadCertificate = async (certificateId) => {
    try {
      const response = await certificateAPI.downloadCertificate(certificateId);
      // Create download link
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const certificate = certificates.find(c => c._id === certificateId);
      link.download = `blood-certificate-${certificate.certificateNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Update download count
      setCertificates(prev => prev.map(cert => 
        cert._id === certificateId 
          ? { ...cert, downloadCount: cert.downloadCount + 1 }
          : cert
      ));
    } catch (err) {
      console.error('Error downloading certificate:', err);
    }
  };

  const getCertificateStats = () => {
    const totalCertificates = certificates.length;
    const sharedCertificates = certificates.filter(c => c.isPublic).length;
    const totalDownloads = certificates.reduce((sum, c) => sum + c.downloadCount, 0);
    const totalViews = certificates.reduce((sum, c) => sum + c.viewCount, 0);
    
    return { totalCertificates, sharedCertificates, totalDownloads, totalViews };
  };

  const stats = getCertificateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchCertificates}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCertificates}</p>
              <p className="text-sm text-gray-600">Total Certificates</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShareIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.sharedCertificates}</p>
              <p className="text-sm text-gray-600">Shared</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowDownTrayIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
              <p className="text-sm text-gray-600">Downloads</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              <p className="text-sm text-gray-600">Total Views</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
          <p className="text-gray-600 mb-4">
            Complete your first blood donation to earn your certificate!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {certificates.map((certificate, index) => (
              <motion.div
                key={certificate._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                  <div className="text-center mb-4">
                    <TrophyIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-red-700">{certificate.certificateTitle}</h3>
                    <p className="text-sm text-gray-600">{new Date(certificate.issuedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleViewCertificate(certificate._id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShareCertificate(certificate._id)}
                        className="p-2 text-gray-600 hover:text-gray-800"
                      >
                        <ShareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadCertificate(certificate._id)}
                        className="p-2 text-gray-600 hover:text-gray-800"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Full Certificate Modal */}
      <AnimatePresence>
        {showFullCertificate && selectedCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowFullCertificate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCertificate.certificateTitle}
                </h2>
                <button
                  onClick={() => setShowFullCertificate(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Certificate Content Here - You can expand this with the full certificate design */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-8">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-red-600 mb-2">
                      {selectedCertificate.certificateTitle}
                    </h1>
                    <p className="text-gray-600">BloodNet+ Blood Donation Platform</p>
                  </div>
                  
                  <div className="text-center mb-8">
                    <p className="text-xl text-gray-700 mb-4">This certificate is proudly presented to</p>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedCertificate.donorName}
                    </h2>
                    <p className="text-lg text-gray-600">Blood Group: {selectedCertificate.bloodGroup}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Donation Date</p>
                      <p className="font-semibold">{new Date(selectedCertificate.donationDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">{selectedCertificate.donationLocation}</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Hospital</p>
                      <p className="font-semibold">{selectedCertificate.hospitalName}</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Total Donations</p>
                      <p className="font-semibold">{selectedCertificate.totalDonations}</p>
                    </div>
                  </div>
                  
                  <div className="text-center bg-white rounded-lg p-6">
                    <p className="text-lg italic text-gray-700 mb-4">
                      "{selectedCertificate.impactMessage}"
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      Lives Impacted: {selectedCertificate.livesSaved}
                    </p>
                  </div>
                  
                  <div className="text-center mt-8 text-gray-500">
                    <p>Certificate #: {selectedCertificate.certificateNumber}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificateGallery;
