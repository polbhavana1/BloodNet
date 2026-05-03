const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_deactivated',
      'request_created', 'request_updated', 'request_deleted', 'request_status_updated',
      'alert_created', 'alert_updated', 'alert_deleted', 'alert_resolved',
      'hospital_created', 'hospital_updated', 'hospital_deleted',
      'system_backup', 'system_restore', 'system_update',
      'security_breach', 'security_lockdown', 'security_unlock',
      'emergency_broadcast', 'emergency_response',
      'content_created', 'content_updated', 'content_deleted',
      'login_attempt', 'login_success', 'login_failure',
      'permission_granted', 'permission_revoked',
      'data_export', 'data_import', 'data_purge'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemAlert'
  },
  details: {
    type: String,
    required: true,
    maxlength: 1000
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['user_management', 'request_management', 'security', 'system', 'emergency', 'content', 'audit'],
    default: 'system'
  },
  metadata: {
    previousValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    affectedRecords: Number,
    duration: Number,
    errorCode: String,
    errorMessage: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // For time-based queries

// Static method to get audit trail for a user
auditLogSchema.statics.getUserTrail = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('targetUserId', 'name email')
    .populate('requestId', 'bloodGroup urgency')
    .populate('alertId', 'type priority');
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = function(limit = 100) {
  return this.find({
    category: 'security',
    severity: { $in: ['high', 'critical'] }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('userId', 'name email');
};

// Static method to get system activity summary
auditLogSchema.statics.getActivitySummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        action: '$_id.action',
        date: '$_id.date',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { date: -1, count: -1 }
    }
  ]);
};

// Static method to cleanup old audit logs
auditLogSchema.statics.cleanupOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $in: ['low', 'medium'] }
  });
};

// Instance method to add context
auditLogSchema.methods.addContext = function(context) {
  Object.assign(this.metadata, context);
  return this.save();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
