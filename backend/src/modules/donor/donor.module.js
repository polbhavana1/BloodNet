const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const User = require('../../models/User');
const Request = require('../../models/Request');
const { haversineDistance } = require('../../utils/geoUtils');

const router = express.Router();

// Get donor profile
router.get('/profile', auth, authorize('donor'), async (req, res) => {
  try {
    const donor = await User.findById(req.user.id).select('-password');
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Get donor's donation history
    const donationHistory = await Request.find({ 
      donorId: req.user.id,
      status: { $in: ['accepted', 'completed'] }
    }).populate('requesterId', 'name phone location')
      .sort({ createdAt: -1 });

    res.json({
      donor,
      donationHistory,
      totalDonations: donationHistory.length
    });
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({ message: 'Server error fetching donor profile' });
  }
});

// Update donor profile
router.put('/profile', auth, authorize('donor'), [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('location.address').optional().notEmpty().withMessage('Address required'),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood group required'),
  body('availability').optional().isBoolean().withMessage('Availability must be boolean'),
  body('lastDonationDate').optional().isISO8601().withMessage('Valid date required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const donor = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      donor
    });
  } catch (error) {
    console.error('Update donor profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Get nearby blood requests
router.get('/nearby-requests', auth, authorize('donor'), async (req, res) => {
  try {
    const { 
      maxDistance = 50, 
      bloodGroup, 
      urgency,
      page = 1,
      limit = 10 
    } = req.query;

    const donor = await User.findById(req.user.id);
    if (!donor || !donor.location) {
      return res.status(400).json({ message: 'Donor location not set' });
    }

    // Build query
    const query = {
      status: 'pending',
      'location.lat': { $exists: true },
      'location.lng': { $exists: true }
    };

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    if (urgency) {
      query.urgency = urgency;
    }

    // Get all pending requests
    const requests = await Request.find(query)
      .populate('requesterId', 'name phone location')
      .sort({ createdAt: -1 });

    // Filter by distance using Haversine formula
    const nearbyRequests = requests.filter(request => {
      if (!request.location || !request.location.lat || !request.location.lng) {
        return false;
      }
      
      const distance = haversineDistance(
        donor.location.lat,
        donor.location.lng,
        request.location.lat,
        request.location.lng
      );
      
      return distance <= parseFloat(maxDistance);
    });

    // Add distance to each request
    const requestsWithDistance = nearbyRequests.map(request => {
      const distance = haversineDistance(
        donor.location.lat,
        donor.location.lng,
        request.location.lat,
        request.location.lng
      );
      
      return {
        ...request.toObject(),
        distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
      };
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRequests = requestsWithDistance.slice(startIndex, endIndex);

    res.json({
      requests: paginatedRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(requestsWithDistance.length / limit),
        totalRequests: requestsWithDistance.length,
        hasNext: endIndex < requestsWithDistance.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get nearby requests error:', error);
    res.status(500).json({ message: 'Server error fetching nearby requests' });
  }
});

// Respond to blood request
router.put('/respond/:requestId', auth, authorize('donor'), [
  body('response').isIn(['accept', 'reject']).withMessage('Response must be accept or reject'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { response, notes } = req.body;
    const { requestId } = req.params;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    const donor = await User.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check if donor is eligible based on blood group
    if (request.bloodGroup !== donor.bloodGroup && donor.bloodGroup !== 'O+') {
      return res.status(400).json({ message: 'Blood group mismatch' });
    }

    // Update request
    if (response === 'accept') {
      request.status = 'accepted';
      request.donorId = req.user.id;
      request.donorResponse = {
        response: 'accept',
        notes,
        respondedAt: new Date()
      };
    } else {
      request.status = 'rejected';
      request.donorResponse = {
        response: 'reject',
        notes,
        respondedAt: new Date()
      };
    }

    await request.save();

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.requesterId}`).emit('requestResponse', {
        requestId: request._id,
        status: request.status,
        donor: {
          id: donor._id,
          name: donor.name,
          phone: donor.phone,
          bloodGroup: donor.bloodGroup
        },
        response: request.donorResponse
      });
    }

    res.json({
      message: `Request ${response}ed successfully`,
      request
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ message: 'Server error responding to request' });
  }
});

// Get donor's donation history
router.get('/donation-history', auth, authorize('donor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { donorId: req.user.id };
    if (status) {
      query.status = status;
    }

    const donations = await Request.find(query)
      .populate('requesterId', 'name phone location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments(query);

    res.json({
      donations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDonations: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({ message: 'Server error fetching donation history' });
  }
});

// Update donor availability
router.put('/availability', auth, authorize('donor'), [
  body('available').isBoolean().withMessage('Available must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { available } = req.body;

    const donor = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          'availability.available': available,
          'availability.lastUpdated': new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Availability updated successfully',
      donor
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error updating availability' });
  }
});

// Get donor statistics
router.get('/statistics', auth, authorize('donor'), async (req, res) => {
  try {
    const donor = await User.findById(req.user.id);
    
    const totalDonations = await Request.countDocuments({ 
      donorId: req.user.id,
      status: { $in: ['accepted', 'completed'] }
    });

    const pendingResponses = await Request.countDocuments({ 
      donorId: req.user.id,
      status: 'pending'
    });

    const completedDonations = await Request.countDocuments({ 
      donorId: req.user.id,
      status: 'completed'
    });

    const lastDonation = await Request.findOne({ 
      donorId: req.user.id,
      status: 'completed'
    }).sort({ createdAt: -1 });

    res.json({
      totalDonations,
      pendingResponses,
      completedDonations,
      lastDonationDate: lastDonation ? lastDonation.createdAt : null,
      bloodGroup: donor.bloodGroup,
      availability: donor.availability?.available || false
    });
  } catch (error) {
    console.error('Get donor statistics error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;
