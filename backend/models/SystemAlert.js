const mongoose = require('mongoose');

const systemAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['emergency', 'system', 'security', 'performance', 'maintenance', 'user']
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'resolved', 'dismissed'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    type: String,
    maxlength: 500
  },
  resolvedAt: {
    type: Date
  },
  metadata: {
    source: String,
    details: mongoose.Schema.Types.Mixed,
    affectedUsers: [mongoose.Schema.Types.ObjectId],
    affectedSystems: [String]
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
systemAlertSchema.index({ type: 1, status: 1, priority: 1 });
systemAlertSchema.index({ createdAt: -1 });
systemAlertSchema.index({ status: 1, priority: 1 });

// Method to resolve alert
systemAlertSchema.methods.resolve = function(userId, resolution) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolution = resolution;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to dismiss alert
systemAlertSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  return this.save();
};

// Static method to get active alerts by priority
systemAlertSchema.statics.getActiveAlerts = function(priority) {
  const query = { status: 'active' };
  if (priority) {
    query.priority = priority;
  }
  return this.find(query).sort({ priority: -1, createdAt: -1 });
};

// Static method to cleanup expired alerts
systemAlertSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    status: 'resolved',
    resolvedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days ago
  });
};

module.exports = mongoose.model('SystemAlert', systemAlertSchema);
