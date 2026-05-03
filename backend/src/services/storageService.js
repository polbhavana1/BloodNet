/**
 * AWS S3 Storage Service for BloodNet+
 * Handles document and media storage, retrieval, and management
 */

const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');

class StorageService {
  constructor() {
    this.s3 = null;
    this.upload = null;
    this.initializeAWS();
  }

  /**
   * Initialize AWS S3 service
   */
  initializeAWS() {
    try {
      // Configure AWS SDK
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      });

      // Create S3 instance
      this.s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        signatureVersion: 'v4',
      });

      // Configure multer for S3 uploads
      this.upload = multer({
        storage: multerS3({
          s3: this.s3,
          bucket: process.env.AWS_S3_BUCKET,
          metadata: (req, file, cb) => {
            cb(null, {
              fieldName: file.fieldname,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              uploadTime: new Date().toISOString(),
            });
          },
          key: (req, file, cb) => {
            const uniqueSuffix = crypto.randomBytes(16).toString('hex');
            const extension = path.extname(file.originalname);
            const filename = `${file.fieldname}-${Date.now()}-${uniqueSuffix}${extension}`;
            const folder = this.getFolderFromFileType(file.mimetype);
            cb(null, `${folder}/${filename}`);
          },
          contentType: multerS3.AUTO_CONTENT_TYPE,
          serverSideEncryption: 'AES256',
        }),
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit
        },
        fileFilter: this.fileFilter.bind(this),
      });

      console.log('AWS S3 storage service initialized');
    } catch (error) {
      console.error('Error initializing AWS S3:', error);
    }
  }

  /**
   * Get folder name based on file type
   * @param {string} mimeType - File MIME type
   * @returns {string} Folder name
   */
  getFolderFromFileType(mimeType) {
    if (mimeType.startsWith('image/')) {
      return 'images';
    } else if (mimeType.startsWith('video/')) {
      return 'videos';
    } else if (mimeType.includes('document') || mimeType.includes('pdf')) {
      return 'documents';
    } else if (mimeType.includes('audio')) {
      return 'audio';
    } else {
      return 'others';
    }
  }

  /**
   * Filter files based on type and size
   * @param {Object} req - Request object
   * @param {Object} file - File object
   * @param {Function} cb - Callback function
   */
  fileFilter(req, file, cb) {
    // Allowed MIME types
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      // Videos
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }

  /**
   * Upload single file
   * @param {Object} file - File object
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, options = {}) {
    try {
      if (!this.s3) {
        throw new Error('S3 service not initialized');
      }

      // Process image if needed
      let processedFile = file;
      if (file.mimetype.startsWith('image/') && options.resize) {
        processedFile = await this.processImage(file, options.resize);
      }

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: processedFile.key,
        Body: processedFile.buffer,
        ContentType: processedFile.mimetype,
        ServerSideEncryption: 'AES256',
        Metadata: {
          originalName: file.originalname,
          uploadedBy: options.uploadedBy || 'anonymous',
          category: options.category || 'general',
        },
      };

      const result = await this.s3.upload(uploadParams).promise();

      // Generate different URL formats
      const urls = this.generateUrls(result.Key);

      return {
        success: true,
        file: {
          key: result.Key,
          location: result.Location,
          bucket: result.Bucket,
          etag: result.ETag,
          size: processedFile.size,
          mimeType: processedFile.mimeType,
          originalName: file.originalname,
          urls,
          uploadedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   * @param {Array} files - Array of file objects
   * @param {Object} options - Upload options
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleFiles(files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.allSettled(uploadPromises);
      
      return results.map((result, index) => ({
        file: files[index].originalname,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw error;
    }
  }

  /**
   * Process image with Sharp
   * @param {Object} file - File object
   * @param {Object} resizeOptions - Resize options
   * @returns {Object} Processed file
   */
  async processImage(file, resizeOptions) {
    try {
      let image = sharp(file.buffer);

      // Resize image
      if (resizeOptions.width || resizeOptions.height) {
        image = image.resize(resizeOptions.width, resizeOptions.height, {
          fit: resizeOptions.fit || 'cover',
          position: resizeOptions.position || 'center',
        });
      }

      // Convert format
      if (resizeOptions.format) {
        image = image.toFormat(resizeOptions.format, {
          quality: resizeOptions.quality || 80,
        });
      }

      // Apply additional transformations
      if (resizeOptions.grayscale) {
        image = image.grayscale();
      }

      if (resizeOptions.blur) {
        image = image.blur(resizeOptions.blur);
      }

      const buffer = await image.toBuffer();
      const mimeType = `image/${resizeOptions.format || 'jpeg'}`;

      return {
        ...file,
        buffer,
        mimeType,
        size: buffer.length,
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Generate different URL formats for the file
   * @param {string} key - S3 key
   * @returns {Object} URL formats
   */
  generateUrls(key) {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || 'us-east-1';
    
    return {
      original: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
      cloudfront: process.env.AWS_CLOUDFRONT_DOMAIN 
        ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`
        : null,
      signed: this.getSignedUrl.bind(this, key),
      thumbnail: this.getThumbnailUrl.bind(this, key),
    };
  }

  /**
   * Get signed URL for private files
   * @param {string} key - S3 key
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {string} Signed URL
   */
  getSignedUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: expiresIn,
      };

      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }

  /**
   * Get thumbnail URL
   * @param {string} key - Original file key
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(key) {
    const thumbnailKey = key.replace(/(\.[^.]+)$/, '_thumb$1');
    return this.getSignedUrl(thumbnailKey, 86400); // 24 hours
  }

  /**
   * Delete file from S3
   * @param {string} key - S3 key
   * @returns {Promise<boolean>} Delete success
   */
  async deleteFile(key) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple files
   * @param {Array} keys - Array of S3 keys
   * @returns {Promise<Object>} Delete results
   */
  async deleteMultipleFiles(keys) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
        },
      };

      const result = await this.s3.deleteObjects(params).promise();
      
      return {
        deleted: result.Deleted,
        failed: result.Errors || [],
      };
    } catch (error) {
      console.error('Multiple delete error:', error);
      throw error;
    }
  }

  /**
   * Get file information
   * @param {string} key - S3 key
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(key) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      };

      const result = await this.s3.headObject(params).promise();
      
      return {
        key,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag,
        metadata: result.Metadata,
        urls: this.generateUrls(key),
      };
    } catch (error) {
      console.error('Get file info error:', error);
      throw error;
    }
  }

  /**
   * List files in folder
   * @param {string} folder - Folder name
   * @param {number} maxKeys - Maximum number of keys to return
   * @returns {Promise<Array>} List of files
   */
  async listFiles(folder, maxKeys = 1000) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: folder,
        MaxKeys: maxKeys,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        etag: file.ETag,
        urls: this.generateUrls(file.Key),
      }));
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  /**
   * Copy file
   * @param {string} sourceKey - Source key
   * @param {string} destinationKey - Destination key
   * @returns {Promise<boolean>} Copy success
   */
  async copyFile(sourceKey, destinationKey) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        CopySource: `${process.env.AWS_S3_BUCKET}/${sourceKey}`,
        Key: destinationKey,
      };

      await this.s3.copyObject(params).promise();
      return true;
    } catch (error) {
      console.error('Copy error:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      // Get bucket size (this is a simplified approach)
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
      };

      const objects = await this.s3.listObjectsV2({
        ...params,
        MaxKeys: 1000,
      }).promise();

      let totalSize = 0;
      let fileCount = 0;

      objects.Contents.forEach(obj => {
        totalSize += obj.Size;
        fileCount++;
      });

      return {
        totalSize,
        fileCount,
        averageFileSize: fileCount > 0 ? totalSize / fileCount : 0,
        lastSynced: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      throw error;
    }
  }

  /**
   * Get multer middleware for express
   * @param {string} fieldName - Field name for file upload
   * @returns {Function} Multer middleware
   */
  getUploadMiddleware(fieldName = 'file') {
    return this.upload.single(fieldName);
  }

  /**
   * Get multer middleware for multiple files
   * @param {string} fieldName - Field name
   * @param {number} maxCount - Maximum number of files
   * @returns {Function} Multer middleware
   */
  getMultipleUploadMiddleware(fieldName = 'files', maxCount = 5) {
    return this.upload.array(fieldName, maxCount);
  }
}

module.exports = new StorageService();
