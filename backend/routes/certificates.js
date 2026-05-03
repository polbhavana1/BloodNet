const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Request = require('../models/Request');
const auth = require('../middleware/auth');
const QRCode = require('qrcode');
const path = require('path');

// Generate certificate after donation completion
router.post('/generate/:donationId', auth, async (req, res) => {
  try {
    const { donationId } = req.params;
    
    // Get donation details
    const donation = await Request.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ donationId });
    if (existingCertificate) {
      return res.status(400).json({ message: 'Certificate already generated for this donation' });
    }

    // Get donor details
    const donor = await User.findById(donation.donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Count total donations for this donor
    const totalDonations = await Request.countDocuments({ 
      donorId: donation.donorId, 
      status: 'completed' 
    });

    // Determine certificate type
    let certificateType = 'regular';
    let milestoneBadge = null;
    
    if (totalDonations === 1) {
      certificateType = 'first-time';
    } else if (totalDonations % 10 === 0) {
      certificateType = 'milestone';
      milestoneBadge = `${totalDonations} Donations`;
    } else if (donation.urgency === 'emergency') {
      certificateType = 'emergency';
    }

    // Generate QR code
    const qrData = JSON.stringify({
      certificateNumber: `BLOOD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      donorId: donor._id,
      donationId: donation._id,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-certificate`
    });
    
    const qrCode = await QRCode.toDataURL(qrData);

    // Create certificate
    const certificate = new Certificate({
      donorId: donation.donorId,
      donationId: donation._id,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      donationDate: donation.completedAt || new Date(),
      donationLocation: donation.location || 'Blood Bank',
      hospitalName: donation.hospitalName || 'General Hospital',
      totalDonations,
      certificateType,
      milestoneBadge,
      qrCode,
      impactMessage: generateImpactMessage(totalDonations, certificateType)
    });

    await certificate.save();

    // Update user with certificate reference
    donor.certificates = donor.certificates || [];
    donor.certificates.push(certificate._id);
    await donor.save();

    res.status(201).json({
      message: 'Certificate generated successfully',
      certificate
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all certificates for a donor
router.get('/my-certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ donorId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('donationId', 'urgency recipientName');

    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single certificate
router.get('/:certificateId', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId)
      .populate('donationId', 'urgency recipientName location')
      .populate('donorId', 'name email');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check ownership
    if (certificate.donorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    certificate.viewCount += 1;
    await certificate.save();

    res.json(certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share certificate
router.post('/:certificateId/share', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check ownership
    if (certificate.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    certificate.isPublic = true;
    certificate.sharedOn = new Date();
    await certificate.save();

    res.json({ message: 'Certificate shared successfully' });
  } catch (error) {
    console.error('Error sharing certificate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download certificate
router.get('/:certificateId/download', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId)
      .populate('donorId', 'name email bloodGroup');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check ownership
    if (certificate.donorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment download count
    certificate.downloadCount += 1;
    await certificate.save();

    // Generate certificate HTML for download
    const certificateHTML = generateCertificateHTML(certificate);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="blood-certificate-${certificate.certificateNumber}.html"`);
    res.send(certificateHTML);

  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate impact message
function generateImpactMessage(totalDonations, certificateType) {
  const messages = {
    'first-time': "Thank you for your first life-saving blood donation! You've started an incredible journey of saving lives.",
    'regular': "Your continued commitment to blood donation makes a real difference in our community.",
    'milestone': `Amazing milestone! ${totalDonations} donations and counting. You're a true hero!`,
    'emergency': "Your quick response in an emergency situation helped save precious lives. Thank you for being a hero!"
  };
  
  return messages[certificateType] || messages['regular'];
}

// Helper function to generate certificate HTML
function generateCertificateHTML(certificate) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blood Donation Certificate</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Text:wght@400;600&family=Open+Sans:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            font-family: 'Crimson Text', serif;
            color: #333;
        }
        
        .certificate-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border: 8px solid #8B0000;
            padding: 60px;
            position: relative;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        .certificate-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(139, 0, 0, 0.03) 35px, rgba(139, 0, 0, 0.03) 70px),
                repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(139, 0, 0, 0.03) 35px, rgba(139, 0, 0, 0.03) 70px);
            pointer-events: none;
        }
        
        .certificate-header {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            z-index: 1;
        }
        
        .certificate-title {
            font-family: 'Playfair Display', serif;
            font-size: 54px;
            font-weight: 900;
            color: #8B0000;
            margin: 0 0 10px 0;
            line-height: 1.1;
            letter-spacing: 2px;
        }
        
        .certificate-subtitle {
            font-family: 'Open Sans', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin: 0;
        }
        
        .certificate-seal {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border: 3px solid #8B0000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            font-weight: bold;
            color: #8B0000;
            font-size: 12px;
            text-align: center;
            line-height: 1.2;
        }
        
        .certificate-body {
            text-align: center;
            margin: 40px 0;
            position: relative;
            z-index: 1;
        }
        
        .certificate-text {
            font-size: 20px;
            line-height: 1.6;
            color: #444;
            margin-bottom: 30px;
        }
        
        .recipient-name {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            color: #8B0000;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 3px solid #8B0000;
            display: inline-block;
            padding: 0 20px 10px 20px;
        }
        
        .certificate-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin: 40px 0;
            text-align: left;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #ddd;
        }
        
        .detail-label {
            font-family: 'Open Sans', sans-serif;
            font-weight: 600;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .detail-value {
            font-weight: 600;
            color: #333;
            font-size: 16px;
        }
        
        .certificate-quote {
            font-style: italic;
            font-size: 18px;
            color: #555;
            margin: 30px 0;
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid #8B0000;
            text-align: left;
        }
        
        .certificate-footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            position: relative;
            z-index: 1;
        }
        
        .signature-section {
            text-align: center;
            flex: 1;
        }
        
        .signature-line {
            border-bottom: 2px solid #333;
            width: 250px;
            margin: 0 auto 10px;
        }
        
        .signature-title {
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .certificate-info {
            text-align: right;
            font-family: 'Open Sans', sans-serif;
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        }
        
        .certificate-number {
            font-weight: 600;
            color: #8B0000;
        }
        
        .certificate-date {
            margin-top: 5px;
        }
        
        .blood-drop {
            position: absolute;
            bottom: 30px;
            left: 30px;
            width: 40px;
            height: 50px;
            background: #8B0000;
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            transform: rotate(-15deg);
            opacity: 0.8;
        }
        
        .blood-drop::before {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
        }
        
        .milestone-badge {
            position: absolute;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #8B0000;
            padding: 12px 20px;
            border-radius: 30px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
            z-index: 3;
        }
        
        @media print {
            body { 
                background: white; 
                padding: 0;
            }
            .certificate-container { 
                box-shadow: none; 
                border: 4px solid #8B0000;
                padding: 40px;
            }
        }
        
        @media (max-width: 768px) {
            .certificate-container {
                padding: 30px;
                border: 4px solid #8B0000;
            }
            
            .certificate-title {
                font-size: 36px;
            }
            
            .recipient-name {
                font-size: 28px;
            }
            
            .certificate-details {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .certificate-footer {
                flex-direction: column;
                gap: 30px;
            }
            
            .certificate-info {
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        ${certificate.milestoneBadge ? `<div class="milestone-badge">${certificate.milestoneBadge}</div>` : ''}
        
        <div class="certificate-header">
            <h1 class="certificate-title">Certificate of Appreciation</h1>
            <p class="certificate-subtitle">Blood Donation</p>
            <div class="certificate-seal">BLOODNET+</div>
        </div>
        
        <div class="certificate-body">
            <p class="certificate-text">
                This certificate is proudly presented to
            </p>
            <div class="recipient-name">${certificate.donorName}</div>
            
            <div class="certificate-details">
                <div class="detail-row">
                    <span class="detail-label">Blood Group</span>
                    <span class="detail-value">${certificate.bloodGroup}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Donation Date</span>
                    <span class="detail-value">${certificate.formattedDonationDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Donation Location</span>
                    <span class="detail-value">${certificate.donationLocation}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Hospital</span>
                    <span class="detail-value">${certificate.hospitalName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Donations</span>
                    <span class="detail-value">${certificate.totalDonations}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Lives Impacted</span>
                    <span class="detail-value">${certificate.livesSaved}</span>
                </div>
            </div>
            
            <div class="certificate-quote">
                "${certificate.impactMessage}"
            </div>
        </div>
        
        <div class="certificate-footer">
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-title">Director</div>
                <div class="signature-title">BloodNet+ Foundation</div>
            </div>
            
            <div class="certificate-info">
                <div class="certificate-number">Certificate No: ${certificate.certificateNumber}</div>
                <div class="certificate-date">Issued on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
        </div>
        
        <div class="blood-drop"></div>
    </div>
</body>
</html>
  `;
}

module.exports = router;
