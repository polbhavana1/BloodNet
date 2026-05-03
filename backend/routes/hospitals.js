const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getNearbyHospitals,
  getHospitalInventory,
  updateInventory,
  getAllBloodRequests,
  getHospitalStats,
  getRequestHistory,
  createDonationCamp,
  updateHospitalProfile,
  generateExcelReport,
  getInventoryReport
} = require('../controllers/hospitalController');

const router = express.Router();

const updateInventoryValidation = [
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('unitsAvailable').isInt({ min: 0 }).withMessage('Units must be a non-negative integer'),
  body('operation').optional().isIn(['add', 'subtract', 'set']).withMessage('Invalid operation'),
  body('minThreshold').optional().isInt({ min: 0 }).withMessage('Min threshold must be non-negative'),
  body('maxCapacity').optional().isInt({ min: 1 }).withMessage('Max capacity must be positive'),
];

router.get('/nearby', auth, getNearbyHospitals);

router.get('/inventory', auth, authorize('hospital'), getHospitalInventory);

router.put('/inventory', auth, authorize('hospital'), updateInventoryValidation, updateInventory);

router.get('/requests', auth, authorize('hospital'), getAllBloodRequests);

router.get('/stats', auth, authorize('hospital'), getHospitalStats);

router.get('/history', auth, authorize('hospital'), getRequestHistory);

router.post('/camps', auth, authorize('hospital'), [
  body('name').notEmpty().withMessage('Camp name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('description').optional().isString(),
  body('targetUnits').isInt({ min: 1 }).withMessage('Target units must be positive')
], createDonationCamp);

router.put('/profile', auth, authorize('hospital'), [
  body('hospitalName').optional().isString(),
  body('contactNumber').optional().isString(),
  body('email').optional().isEmail(),
  body('address').optional().isString(),
  body('emergencyContact').optional().isString()
], updateHospitalProfile);

router.get('/report/excel', auth, authorize('hospital'), generateExcelReport);

router.get('/report/inventory', auth, authorize('hospital'), getInventoryReport);

module.exports = router;
