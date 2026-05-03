/**
 * Real-time notification service for BloodNet+
 * Integrates Firebase FCM, Socket.io, and Twilio SMS
 */

const admin = require('firebase-admin');
const socketIo = require('socket.io');
const twilio = require('twilio');
const User = require('../models/User');
const Request = require('../models/Request');

class NotificationService {
  constructor() {
    this.io = null;
    this.twilioClient = null;
    this.firebaseApp = null;
    this.initializeServices();
  }

  /**
   * Initialize all notification services
   */
  async initializeServices() {
    try {
      // Initialize Firebase Admin SDK
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
      }

      // Initialize Twilio
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
      }

      console.log('Notification services initialized successfully');
    } catch (error) {
      console.error('Error initializing notification services:', error);
    }
  }

  /**
   * Initialize Socket.io server
   * @param {Object} httpServer - HTTP server instance
   */
  initializeSocketIo(httpServer) {
    this.io = socketIo(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join user to their personal room
      socket.on('authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
          socket.userId = decoded.userId;
          socket.join(`user_${decoded.userId}`);
          socket.emit('authenticated', { success: true });
        } catch (error) {
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      });

      // Handle donor availability updates
      socket.on('availabilityUpdate', async (data) => {
        try {
          if (!socket.userId) return;

          await User.findByIdAndUpdate(socket.userId, {
            'availability.available': data.available,
            'availability.lastUpdated': new Date()
          });

          // Broadcast to nearby requests
          this.broadcastAvailabilityUpdate(socket.userId, data);
        } catch (error) {
          console.error('Error updating availability:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    return this.io;
  }

  /**
   * Send push notification via Firebase FCM
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   */
  async sendPushNotification(userId, notification) {
    try {
      if (!this.firebaseApp) {
        throw new Error('Firebase not initialized');
      }

      const user = await User.findById(userId);
      if (!user || !user.fcmToken) {
        console.log('User not found or no FCM token');
        return;
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          click_action: notification.clickAction || '/'
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#FF6B6B'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await this.firebaseApp.messaging().send(message);
      console.log('Push notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification via Socket.io
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendSocketNotification(userId, event, data) {
    try {
      if (!this.io) {
        console.log('Socket.io not initialized');
        return;
      }

      this.io.to(`user_${userId}`).emit(event, data);
      console.log(`Socket notification sent to user ${userId}:`, event);
    } catch (error) {
      console.error('Error sending socket notification:', error);
    }
  }

  /**
   * Send SMS notification via Twilio
   * @param {string} phoneNumber - Phone number
   * @param {string} message - SMS message
   */
  async sendSMSNotification(phoneNumber, message) {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio not initialized');
      }

      const response = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('SMS sent successfully:', response.sid);
      return response;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send multi-channel notification
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   * @param {Object} options - Notification options
   */
  async sendMultiChannelNotification(userId, notification, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const promises = [];

      // Send push notification
      if (options.push !== false && user.fcmToken) {
        promises.push(this.sendPushNotification(userId, notification));
      }

      // Send socket notification
      if (options.socket !== false) {
        promises.push(
          Promise.resolve(this.sendSocketNotification(userId, notification.event || 'notification', notification))
        );
      }

      // Send SMS for emergency notifications
      if (options.sms === true || notification.urgency === 'emergency') {
        if (user.phone) {
          const smsMessage = `${notification.title}: ${notification.body}`;
          promises.push(this.sendSMSNotification(user.phone, smsMessage));
        }
      }

      const results = await Promise.allSettled(promises);
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Notification channel ${index} failed:`, result.reason);
        }
      });

      return results;
    } catch (error) {
      console.error('Error sending multi-channel notification:', error);
      throw error;
    }
  }

  /**
   * Notify when blood request is created
   * @param {Object} request - Blood request object
   */
  async notifyRequestCreated(request) {
    try {
      // Find nearby donors
      const { findNearbyDonors } = require('../utils/geoUtils');
      const nearbyDonors = await findNearbyDonors(
        request.location,
        50, // 50km radius
        { bloodGroup: request.bloodGroup, 'availability.available': true }
      );

      // Notify nearby donors
      for (const donor of nearbyDonors) {
        const notification = {
          title: 'New Blood Request Nearby',
          body: `Someone needs ${request.bloodGroup} blood within ${Math.round(donor.distance)}km`,
          icon: '/blood-icon.png',
          clickAction: `/requests/${request._id}`,
          data: {
            requestId: request._id,
            bloodGroup: request.bloodGroup,
            distance: donor.distance,
            urgency: request.urgency
          },
          event: 'newRequest'
        };

        await this.sendMultiChannelNotification(donor._id, notification, {
          push: true,
          socket: true,
          sms: request.urgency === 'emergency'
        });
      }

      // Notify requester
      const requesterNotification = {
        title: 'Blood Request Created',
        body: `Your request for ${request.bloodGroup} blood has been sent to ${nearbyDonors.length} nearby donors`,
        icon: '/request-icon.png',
        clickAction: `/requests/${request._id}`,
        data: {
          requestId: request._id,
          nearbyDonors: nearbyDonors.length
        },
        event: 'requestCreated'
      };

      await this.sendMultiChannelNotification(request.requesterId, requesterNotification);
    } catch (error) {
      console.error('Error notifying request created:', error);
    }
  }

  /**
   * Notify when request is accepted
   * @param {Object} request - Updated request object
   */
  async notifyRequestAccepted(request) {
    try {
      const donor = await User.findById(request.donorId);
      if (!donor) return;

      // Notify requester
      const notification = {
        title: 'Blood Request Accepted!',
        body: `${donor.name} has accepted your blood request`,
        icon: '/accepted-icon.png',
        clickAction: `/requests/${request._id}`,
        data: {
          requestId: request._id,
          donorId: donor._id,
          donorName: donor.name,
          donorPhone: donor.phone
        },
        event: 'requestAccepted'
      };

      await this.sendMultiChannelNotification(request.requesterId, notification, {
        push: true,
        socket: true,
        sms: true
      });

      // Notify donor
      const donorNotification = {
        title: 'Request Accepted',
        body: `You have accepted the blood request for ${request.bloodGroup}`,
        icon: '/donor-icon.png',
        clickAction: `/requests/${request._id}`,
        data: {
          requestId: request._id
        },
        event: 'donorAccepted'
      };

      await this.sendMultiChannelNotification(donor._id, donorNotification);
    } catch (error) {
      console.error('Error notifying request accepted:', error);
    }
  }

  /**
   * Notify when request is completed
   * @param {Object} request - Updated request object
   */
  async notifyRequestCompleted(request) {
    try {
      const donor = await User.findById(request.donorId);
      if (!donor) return;

      // Notify requester
      const notification = {
        title: 'Blood Donation Completed',
        body: 'Thank you! Your blood request has been completed',
        icon: '/completed-icon.png',
        clickAction: `/requests/${request._id}`,
        data: {
          requestId: request._id,
          completedAt: new Date().toISOString()
        },
        event: 'requestCompleted'
      };

      await this.sendMultiChannelNotification(request.requesterId, notification, {
        push: true,
        socket: true
      });

      // Notify donor
      const donorNotification = {
        title: 'Donation Completed',
        body: 'Thank you for your life-saving donation!',
        icon: '/donation-icon.png',
        clickAction: `/profile`,
        data: {
          requestId: request._id,
          completedAt: new Date().toISOString()
        },
        event: 'donationCompleted'
      };

      await this.sendMultiChannelNotification(donor._id, donorNotification, {
        push: true,
        socket: true
      });
    } catch (error) {
      console.error('Error notifying request completed:', error);
    }
  }

  /**
   * Send emergency broadcast
   * @param {Object} request - Emergency blood request
   */
  async sendEmergencyBroadcast(request) {
    try {
      // Find all donors in extended radius
      const { findNearbyDonors } = require('../utils/geoUtils');
      const nearbyDonors = await findNearbyDonors(
        request.location,
        100, // 100km radius for emergency
        { bloodGroup: request.bloodGroup }
      );

      // Send emergency notifications to all nearby donors
      for (const donor of nearbyDonors) {
        const notification = {
          title: '🚨 EMERGENCY BLOOD NEEDED',
          body: `URGENT: ${request.bloodGroup} blood needed within ${Math.round(donor.distance)}km`,
          icon: '/emergency-icon.png',
          clickAction: `/requests/${request._id}`,
          data: {
            requestId: request._id,
            bloodGroup: request.bloodGroup,
            distance: donor.distance,
            urgency: 'emergency'
          },
          event: 'emergencyRequest'
        };

        await this.sendMultiChannelNotification(donor._id, notification, {
          push: true,
          socket: true,
          sms: true // Always send SMS for emergencies
        });
      }

      console.log(`Emergency broadcast sent to ${nearbyDonors.length} donors`);
    } catch (error) {
      console.error('Error sending emergency broadcast:', error);
    }
  }

  /**
   * Broadcast availability update to nearby requests
   * @param {string} donorId - Donor ID
   * @param {Object} availabilityData - Availability data
   */
  async broadcastAvailabilityUpdate(donorId, availabilityData) {
    try {
      const donor = await User.findById(donorId);
      if (!donor || !donor.location) return;

      // Find pending requests within donor's area
      const nearbyRequests = await Request.find({
        status: 'pending',
        bloodGroup: donor.bloodGroup,
        'location.lat': { $exists: true },
        'location.lng': { $exists: true }
      });

      // Filter by distance and notify
      const { haversineDistance } = require('../utils/geoUtils');
      
      for (const request of nearbyRequests) {
        const distance = haversineDistance(
          donor.location.lat,
          donor.location.lng,
          request.location.lat,
          request.location.lng
        );

        if (distance <= 50 && availabilityData.available) {
          this.sendSocketNotification(request.requesterId, 'donorAvailable', {
            donorId: donor._id,
            donorName: donor.name,
            bloodGroup: donor.bloodGroup,
            distance: Math.round(distance * 10) / 10
          });
        }
      }
    } catch (error) {
      console.error('Error broadcasting availability update:', error);
    }
  }

  /**
   * Update user's FCM token
   * @param {string} userId - User ID
   * @param {string} fcmToken - FCM token
   */
  async updateFCMToken(userId, fcmToken) {
    try {
      await User.findByIdAndUpdate(userId, { fcmToken });
      console.log('FCM token updated for user:', userId);
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }

  /**
   * Get notification service status
   */
  getServiceStatus() {
    return {
      firebase: !!this.firebaseApp,
      socketIo: !!this.io,
      twilio: !!this.twilioClient,
      connectedClients: this.io ? this.io.engine.clientsCount : 0
    };
  }
}

module.exports = new NotificationService();
