const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { register, login, getProfile } = require('../controllers/authController');

const router = express.Router();

const registerValidation = [
  body('role').isIn(['recipient', 'donor', 'hospital']).withMessage('Invalid role'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('location.address').optional().notEmpty().withMessage('Address cannot be empty'),
];

const recipientValidation = [
  ...registerValidation,
  body('name').notEmpty().withMessage('Name is required for recipient'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
];

const donorValidation = [
  ...registerValidation,
  body('name').notEmpty().withMessage('Name is required for donor'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('donorHealthDetails.weight').optional().isFloat({ min: 50 }).withMessage('Weight must be at least 50kg'),
  body('donorHealthDetails.hemoglobin').optional().isFloat({ min: 11 }).withMessage('Hemoglobin must be at least 11 g/dL'),
  body('donorHealthDetails.age').optional().isInt({ min: 18 }).withMessage('Age must be at least 18'),
];

const hospitalValidation = [
  ...registerValidation,
  body('hospitalName').notEmpty().withMessage('Hospital name is required'),
  body('contactNumber').isLength({ min: 10 }).withMessage('Contact number must be at least 10 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', async (req, res, next) => {
  console.log('Registration request received:', req.body);
  
  const { role } = req.body;
  
  let validation;
  switch (role) {
    case 'recipient':
      validation = recipientValidation;
      break;
    case 'donor':
      validation = donorValidation;
      break;
    case 'hospital':
      validation = hospitalValidation;
      break;
    default:
      console.log('Invalid role specified:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
  }
  
  await Promise.all(validation.map(validation => validation.run(req)));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  
  console.log('Validation passed, proceeding to registration');
  next();
}, register);

router.post('/login', loginValidation, login);

router.get('/profile', auth, getProfile);

module.exports = router;
