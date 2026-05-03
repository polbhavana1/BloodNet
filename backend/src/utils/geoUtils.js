/**
 * Geo-matching utilities for BloodNet+
 * Implements Haversine formula for distance calculations
 * MongoDB geospatial query helpers
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1  
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Find nearby donors using MongoDB geospatial queries
 * @param {Object} location - { lat, lng } coordinates
 * @param {number} maxDistance - Maximum distance in kilometers
 * @param {Object} filters - Additional filters (bloodGroup, etc.)
 * @returns {Promise<Array>} Array of nearby donors
 */
const findNearbyDonors = async (location, maxDistance = 50, filters = {}) => {
  try {
    const User = require('../models/User');
    
    // Build MongoDB geospatial query
    const query = {
      role: 'donor',
      'availability.available': true,
      'location.lat': { $exists: true },
      'location.lng': { $exists: true },
      ...filters
    };

    // Find donors within distance using geospatial query
    const donors = await User.find(query)
      .select('-password')
      .lean();

    // Filter by distance and add distance field
    const nearbyDonors = donors
      .map(donor => {
        const distance = haversineDistance(
          location.lat,
          location.lng,
          donor.location.lat,
          donor.location.lng
        );
        
        return {
          ...donor,
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
        };
      })
      .filter(donor => donor.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    return nearbyDonors;
  } catch (error) {
    console.error('Error finding nearby donors:', error);
    throw error;
  }
};

/**
 * Find nearby hospitals using MongoDB geospatial queries
 * @param {Object} location - { lat, lng } coordinates
 * @param {number} maxDistance - Maximum distance in kilometers
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of nearby hospitals
 */
const findNearbyHospitals = async (location, maxDistance = 50, filters = {}) => {
  try {
    const User = require('../models/User');
    
    const query = {
      role: 'hospital',
      'location.lat': { $exists: true },
      'location.lng': { $exists: true },
      ...filters
    };

    const hospitals = await User.find(query)
      .select('-password')
      .lean();

    const nearbyHospitals = hospitals
      .map(hospital => {
        const distance = haversineDistance(
          location.lat,
          location.lng,
          hospital.location.lat,
          hospital.location.lng
        );
        
        return {
          ...hospital,
          distance: Math.round(distance * 10) / 10
        };
      })
      .filter(hospital => hospital.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    return nearbyHospitals;
  } catch (error) {
    console.error('Error finding nearby hospitals:', error);
    throw error;
  }
};

/**
 * Find optimal blood donation matches
 * @param {Object} requestLocation - Request location coordinates
 * @param {string} bloodGroup - Required blood group
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Promise<Object>} Matched donors and hospitals
 */
const findOptimalMatches = async (requestLocation, bloodGroup, maxDistance = 50) => {
  try {
    // Find compatible blood groups
    const compatibleGroups = getCompatibleBloodGroups(bloodGroup);
    
    // Find nearby donors with compatible blood groups
    const donorFilters = {
      bloodGroup: { $in: compatibleGroups },
      'availability.available': true
    };
    
    const [nearbyDonors, nearbyHospitals] = await Promise.all([
      findNearbyDonors(requestLocation, maxDistance, donorFilters),
      findNearbyHospitals(requestLocation, maxDistance)
    ]);

    // Score and rank donors
    const scoredDonors = nearbyDonors.map(donor => ({
      ...donor,
      matchScore: calculateDonorScore(donor, bloodGroup, requestLocation)
    })).sort((a, b) => b.matchScore - a.matchScore);

    // Score and rank hospitals
    const scoredHospitals = nearbyHospitals.map(hospital => ({
      ...hospital,
      matchScore: calculateHospitalScore(hospital, requestLocation)
    })).sort((a, b) => b.matchScore - a.matchScore);

    return {
      donors: scoredDonors,
      hospitals: scoredHospitals,
      totalMatches: scoredDonors.length + scoredHospitals.length
    };
  } catch (error) {
    console.error('Error finding optimal matches:', error);
    throw error;
  }
};

/**
 * Get compatible blood groups for donation
 * @param {string} bloodGroup - Required blood group
 * @returns {Array} Array of compatible blood groups
 */
const getCompatibleBloodGroups = (bloodGroup) => {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };
  
  return compatibility[bloodGroup] || [];
};

/**
 * Calculate donor match score
 * @param {Object} donor - Donor object
 * @param {string} requiredBloodGroup - Required blood group
 * @param {Object} requestLocation - Request location
 * @returns {number} Match score (0-100)
 */
const calculateDonorScore = (donor, requiredBloodGroup, requestLocation) => {
  let score = 0;
  
  // Blood group compatibility (40 points)
  if (donor.bloodGroup === requiredBloodGroup) {
    score += 40;
  } else if (getCompatibleBloodGroups(requiredBloodGroup).includes(donor.bloodGroup)) {
    score += 30;
  }
  
  // Distance factor (30 points) - closer is better
  const maxScoreDistance = 50; // km
  if (donor.distance <= maxScoreDistance) {
    score += 30 * (1 - donor.distance / maxScoreDistance);
  }
  
  // Availability (20 points)
  if (donor.availability?.available) {
    score += 20;
  }
  
  // Recent donation history (10 points) - bonus if not donated recently
  if (!donor.lastDonationDate || 
      Date.now() - new Date(donor.lastDonationDate).getTime() > 90 * 24 * 60 * 60 * 1000) {
    score += 10;
  }
  
  return Math.round(score);
};

/**
 * Calculate hospital match score
 * @param {Object} hospital - Hospital object
 * @param {Object} requestLocation - Request location
 * @returns {number} Match score (0-100)
 */
const calculateHospitalScore = (hospital, requestLocation) => {
  let score = 0;
  
  // Distance factor (50 points)
  const maxScoreDistance = 50; // km
  if (hospital.distance <= maxScoreDistance) {
    score += 50 * (1 - hospital.distance / maxScoreDistance);
  }
  
  // Hospital capacity (30 points) - if available
  if (hospital.inventory?.capacity > 0) {
    score += 30;
  }
  
  // Emergency services (20 points)
  if (hospital.emergencyServices) {
    score += 20;
  }
  
  return Math.round(score);
};

/**
 * Create geospatial index for MongoDB
 * @returns {Promise<void>}
 */
const createGeoIndexes = async () => {
  try {
    const User = require('../models/User');
    
    // Create 2dsphere index for location fields
    await User.collection.createIndex({ 
      'location': '2dsphere' 
    });
    
    console.log('Geospatial indexes created successfully');
  } catch (error) {
    console.error('Error creating geospatial indexes:', error);
  }
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Valid coordinates
 */
const validateCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Format location for display
 * @param {Object} location - Location object
 * @returns {string} Formatted location string
 */
const formatLocation = (location) => {
  if (!location) return 'Location not specified';
  
  if (location.address) {
    return location.address;
  }
  
  if (location.lat && location.lng) {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  }
  
  return 'Location not specified';
};

module.exports = {
  haversineDistance,
  findNearbyDonors,
  findNearbyHospitals,
  findOptimalMatches,
  getCompatibleBloodGroups,
  calculateDonorScore,
  calculateHospitalScore,
  createGeoIndexes,
  validateCoordinates,
  formatLocation,
  toRadians
};
