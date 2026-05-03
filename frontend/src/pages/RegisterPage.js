import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  HeartIcon as HeartSolidIcon, 
  EyeIcon, 
  EyeSlashIcon,
  UserIcon,
  BuildingOfficeIcon,
  HeartIcon
} from '@heroicons/react/24/solid';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    role: 'recipient',
    name: '',
    hospitalName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    contactNumber: '',
    bloodGroup: '',
    location: {
      lat: 0,
      lng: 0
    },
    donorHealthDetails: {
      weight: '',
      hemoglobin: '',
      age: ''
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  
  const { register, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    clearError();
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.role) {
        newErrors.role = 'Please select a role';
      }
    }
    
    if (step === 2) {
      if (formData.role !== 'hospital' && !formData.name) {
        newErrors.name = 'Name is required';
      }
      if (formData.role === 'hospital' && !formData.hospitalName) {
        newErrors.hospitalName = 'Hospital name is required';
      }
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (step === 3) {
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      }
      if (formData.role === 'hospital' && !formData.contactNumber) {
        newErrors.contactNumber = 'Contact number is required';
      }
      if (formData.role !== 'hospital' && !formData.bloodGroup) {
        newErrors.bloodGroup = 'Blood group is required';
      }
      if (formData.role === 'donor') {
        if (!formData.donorHealthDetails.weight || formData.donorHealthDetails.weight < 50) {
          newErrors.weight = 'Weight must be at least 50kg';
        }
        if (!formData.donorHealthDetails.hemoglobin || formData.donorHealthDetails.hemoglobin < 11) {
          newErrors.hemoglobin = 'Hemoglobin must be at least 11 g/dL';
        }
        if (!formData.donorHealthDetails.age || formData.donorHealthDetails.age < 18) {
          newErrors.age = 'Age must be at least 18';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    console.log('Submitting registration with data:', formData);
    
    try {
      const response = await register(formData);
      console.log('Registration successful:', response);
      navigate(`/dashboard/${response.user.role}`);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      alert(`Registration failed: ${err.response?.data?.message || 'Unknown error'}`);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <HeartSolidIcon className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Join BloodNet+
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create an account to save lives
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-8 h-1 mx-2 ${
                      step < currentStep ? 'bg-red-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white shadow-lg rounded-2xl p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select your role
                </h3>
                
                <div className="space-y-4">
                  {[
                    { value: 'recipient', label: 'Blood Recipient', icon: <UserIcon className="h-6 w-6" /> },
                    { value: 'donor', label: 'Blood Donor', icon: <HeartIcon className="h-6 w-6" /> },
                    { value: 'hospital', label: 'Hospital', icon: <BuildingOfficeIcon className="h-6 w-6" /> }
                  ].map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.role === role.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          formData.role === role.value ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {role.icon}
                        </div>
                        <span className="font-medium">{role.label}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role}</p>
                )}
              </motion.div>
            )}

            {/* Step 2: Basic Information */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>

                {formData.role !== 'hospital' ? (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital Name
                    </label>
                    <input
                      id="hospitalName"
                      name="hospitalName"
                      type="text"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.hospitalName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter hospital name"
                    />
                    {errors.hospitalName && <p className="mt-1 text-sm text-red-600">{errors.hospitalName}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Information
                </h3>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {formData.role === 'hospital' && (
                  <div>
                    <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Number
                    </label>
                    <input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter emergency contact number"
                    />
                    {errors.contactNumber && <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>}
                  </div>
                )}

                {formData.role !== 'hospital' && (
                  <div>
                    <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.bloodGroup ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select blood group</option>
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                    {errors.bloodGroup && <p className="mt-1 text-sm text-red-600">{errors.bloodGroup}</p>}
                  </div>
                )}

                {formData.role === 'donor' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Health Details</h4>
                    
                    <div>
                      <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        id="weight"
                        name="donorHealthDetails.weight"
                        type="number"
                        value={formData.donorHealthDetails.weight}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.weight ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your weight"
                      />
                      {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                    </div>

                    <div>
                      <label htmlFor="hemoglobin" className="block text-sm font-medium text-gray-700 mb-2">
                        Hemoglobin (g/dL)
                      </label>
                      <input
                        id="hemoglobin"
                        name="donorHealthDetails.hemoglobin"
                        type="number"
                        step="0.1"
                        value={formData.donorHealthDetails.hemoglobin}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.hemoglobin ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter hemoglobin level"
                      />
                      {errors.hemoglobin && <p className="mt-1 text-sm text-red-600">{errors.hemoglobin}</p>}
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        id="age"
                        name="donorHealthDetails.age"
                        type="number"
                        value={formData.donorHealthDetails.age}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.age ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your age"
                      />
                      {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="px-6 py-3"
                >
                  Back
                </Button>
              )}
              
              <div className="flex-1" />
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="px-6 py-3"
                >
                  Create Account
                </Button>
              )}
            </div>
          </div>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            Already have an account? Sign in
          </Link>
          <div className="mt-2">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <HeartIcon className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
