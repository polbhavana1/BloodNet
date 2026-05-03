const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  donorName: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    required: true
  },
  donationDate: {
    type: Date,
    required: true
  },
  donationLocation: {
    type: String,
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  livesSaved: {
    type: Number,
    default: 3
  },
  certificateType: {
    type: String,
    enum: ['first-time', 'regular', 'milestone', 'emergency'],
    default: 'regular'
  },
  milestoneBadge: {
    type: String,
    default: null
  },
  totalDonations: {
    type: Number,
    required: true
  },
  impactMessage: {
    type: String,
    default: "Thank you for your life-saving donation!"
  },
  qrCode: {
    type: String,
    default: null
  },
  certificateUrl: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedOn: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate unique certificate number
certificateSchema.pre('save', async function(next) {
  if (!this.certificateNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    this.certificateNumber = `BLOOD-${year}-${random}`;
  }
  next();
});

// Virtual for formatted donation date
certificateSchema.virtual('formattedDonationDate').get(function() {
  return this.donationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for certificate title based on type
certificateSchema.virtual('certificateTitle').get(function() {
  switch(this.certificateType) {
    case 'first-time':
      return 'First Blood Donation Certificate';
    case 'milestone':
      return `${this.totalDonations}th Donation Milestone Certificate`;
    case 'emergency':
      return 'Emergency Blood Donation Certificate';
    default:
      return 'Blood Donation Certificate';
  }
});

module.exports = mongoose.model('Certificate', certificateSchema);
