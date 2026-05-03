const mongoose = require('mongoose');

const donationCampSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  targetUnits: {
    type: Number,
    required: true,
    min: 1
  },
  actualUnits: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  donors: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unitsDonated: {
      type: Number,
      default: 0
    },
    donationDate: {
      type: Date
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
donationCampSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating completion percentage
donationCampSchema.virtual('completionPercentage').get(function() {
  if (this.targetUnits === 0) return 0;
  return Math.min((this.actualUnits / this.targetUnits) * 100, 100);
});

// Virtual for checking if camp is today
donationCampSchema.virtual('isToday').get(function() {
  const today = new Date();
  const campDate = new Date(this.date);
  return campDate.toDateString() === today.toDateString();
});

// Virtual for checking if camp is in the past
donationCampSchema.virtual('isPast').get(function() {
  return new Date(this.date) < new Date();
});

// Method to add donor to camp
donationCampSchema.methods.addDonor = function(donorId, unitsDonated) {
  const existingDonor = this.donors.find(d => d.donorId.toString() === donorId.toString());
  
  if (existingDonor) {
    existingDonor.unitsDonated += unitsDonated;
  } else {
    this.donors.push({
      donorId,
      unitsDonated,
      donationDate: new Date()
    });
  }
  
  this.actualUnits += unitsDonated;
  
  // Update status if target is met
  if (this.actualUnits >= this.targetUnits) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Static method to find upcoming camps
donationCampSchema.statics.findUpcoming = function(hospitalId) {
  return this.find({
    hospitalId,
    date: { $gte: new Date() },
    status: { $in: ['upcoming', 'ongoing'] }
  }).sort({ date: 1 });
};

// Static method to find past camps
donationCampSchema.statics.findPast = function(hospitalId) {
  return this.find({
    hospitalId,
    date: { $lt: new Date() }
  }).sort({ date: -1 });
};

module.exports = mongoose.model('DonationCamp', donationCampSchema);
