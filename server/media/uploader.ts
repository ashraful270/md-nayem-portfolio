import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config.ts';
import { isMongoActive, MediaAssetModel } from '../db/mongo.ts';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize Cloudinary if configured
let isCloudinaryConfigured = false;
if (config.media.cloudinary) {
  cloudinary.config({
    cloud_name: config.media.cloudinary.cloudName,
    api_key: config.media.cloudinary.apiKey,
    api_secret: config.media.cloudinary.apiSecret,
    secure: true,
  });
  isCloudinaryConfigured = true;
  console.log(`☁️ [MEDIA STORAGE] Cloudinary configured for cloud name: ${config.media.cloudinary.cloudName}`);
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
  isCloudinaryConfigured = true;
  console.log('☁️ [MEDIA STORAGE] Cloudinary configured via CLOUDINARY_URL');
}

// Whitelisted MIME types and limits
export const ALLOWED_MIME_TYPES: Record<string, { ext: string; category: 'image' | 'video' | 'model3d' | 'certificate' | 'other'; maxSizeMb: number }> = {
  // Images (Max 15MB)
  'image/jpeg': { ext: 'jpg', category: 'image', maxSizeMb: 15 },
  'image/jpg': { ext: 'jpg', category: 'image', maxSizeMb: 15 },
  'image/png': { ext: 'png', category: 'image', maxSizeMb: 15 },
  'image/webp': { ext: 'webp', category: 'image', maxSizeMb: 15 },
  'image/svg+xml': { ext: 'svg', category: 'image', maxSizeMb: 15 },

  // 3D Models (Max 50MB)
  'model/gltf-binary': { ext: 'glb', category: 'model3d', maxSizeMb: 50 },
  'model/gltf+json': { ext: 'gltf', category: 'model3d', maxSizeMb: 50 },
  'application/octet-stream': { ext: 'glb', category: 'model3d', maxSizeMb: 50 },

  // Videos (Max 50MB)
  'video/mp4': { ext: 'mp4', category: 'video', maxSizeMb: 50 },
  'video/webm': { ext: 'webm', category: 'video', maxSizeMb: 50 },
  'video/quicktime': { ext: 'mov', category: 'video', maxSizeMb: 50 },
};

export const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'svg',
  'glb', 'gltf',
  'mp4', 'webm', 'mov'
]);

export interface UploadResult {
  url: string;
  filename: string;
  publicId?: string;
  provider: 'cloudinary' | 's3' | 'local';
  size: number;
  mimeType: string;
  category: 'image' | 'video' | 'model3d' | 'certificate' | 'other';
}

export async function uploadMediaFile(dataUrl: string, originalFilename?: string): Promise<UploadResult> {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('dataUrl base64 string is required');
  }

  const matches = dataUrl.match(/^data:([A-Za-z0-9-+.\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 Data URL format');
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const sizeBytes = buffer.length;

  // Determine file extension
  let fileExt = '';
  if (originalFilename) {
    const parts = originalFilename.split('.');
    fileExt = (parts.pop() || '').toLowerCase();
    if (fileExt === 'jpeg') fileExt = 'jpg';
  }

  // Validate extension if provided
  if (fileExt && !ALLOWED_EXTENSIONS.has(fileExt)) {
    throw new Error(`File extension '.${fileExt}' is not allowed for security reasons.`);
  }

  // Check MIME rule
  let rule = ALLOWED_MIME_TYPES[mimeType];
  if (!rule && fileExt) {
    // If browser reported generic octet-stream for .glb
    if (fileExt === 'glb') {
      rule = ALLOWED_MIME_TYPES['model/gltf-binary'];
    } else if (fileExt === 'gltf') {
      rule = ALLOWED_MIME_TYPES['model/gltf+json'];
    }
  }

  if (!rule) {
    throw new Error(`Unsupported MIME type: '${mimeType}'. Supported: Images (JPG, PNG, WEBP, SVG), 3D Models (GLB, GLTF), Videos (MP4, WEBM).`);
  }

  const ext = fileExt || rule.ext;
  const maxBytes = rule.maxSizeMb * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    throw new Error(`File size (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of ${rule.maxSizeMb}MB for ${rule.category}.`);
  }

  const sanitizedBase = (originalFilename ? originalFilename.split('.')[0] : 'asset')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 30);
  const uniqueKey = `${sanitizedBase}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const fullFileName = `${uniqueKey}.${ext}`;

  // 1. UPLOAD TO CLOUDINARY IF CONFIGURED
  if (isCloudinaryConfigured) {
    try {
      const resourceType = rule.category === 'video' ? 'video' : (rule.category === 'model3d' ? 'raw' : 'image');
      const uploadResponse = await cloudinary.uploader.upload(dataUrl, {
        folder: 'portfolio-nayem',
        public_id: uniqueKey,
        resource_type: resourceType,
        overwrite: true,
      });

      const result: UploadResult = {
        url: uploadResponse.secure_url || uploadResponse.url,
        filename: fullFileName,
        publicId: uploadResponse.public_id,
        provider: 'cloudinary',
        size: sizeBytes,
        mimeType,
        category: rule.category,
      };

      // Record in Mongo MediaAsset if active
      if (isMongoActive()) {
        try {
          await MediaAssetModel.create({
            id: `media-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            url: result.url,
            publicId: result.publicId,
            provider: 'cloudinary',
            mimeType,
            size: sizeBytes,
            originalName: originalFilename || fullFileName,
            category: rule.category,
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('Failed to record MediaAsset in Mongo:', dbErr);
        }
      }

      return result;
    } catch (cErr: any) {
      console.error('Cloudinary upload failed, falling back to local storage:', cErr.message);
    }
  }

  // 2. FALLBACK / LOCAL DISK STORAGE
  const localFilePath = path.join(UPLOADS_DIR, fullFileName);
  fs.writeFileSync(localFilePath, buffer);
  const localUrl = `/uploads/${fullFileName}`;

  const result: UploadResult = {
    url: localUrl,
    filename: fullFileName,
    publicId: fullFileName,
    provider: 'local',
    size: sizeBytes,
    mimeType,
    category: rule.category,
  };

  if (isMongoActive()) {
    try {
      await MediaAssetModel.create({
        id: `media-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        url: localUrl,
        publicId: fullFileName,
        provider: 'local',
        mimeType,
        size: sizeBytes,
        originalName: originalFilename || fullFileName,
        category: rule.category,
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Failed to record MediaAsset in Mongo:', dbErr);
    }
  }

  return result;
}

export function getMediaStorageInfo() {
  return {
    provider: isCloudinaryConfigured ? 'cloudinary' : 'local',
    cloudinaryConfigured: isCloudinaryConfigured,
    localUploadsDirectory: UPLOADS_DIR,
    allowedExtensions: Array.from(ALLOWED_EXTENSIONS),
  };
}
