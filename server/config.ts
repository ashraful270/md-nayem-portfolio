import crypto from 'node:crypto';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  appUrl: string;
  jwtSecret: string;
  mongoUri?: string;
  adminUsername: string;
  adminPassword?: string;
  media: {
    provider: 'cloudinary' | 's3' | 'local';
    cloudinary?: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
    s3?: {
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
      publicDomain?: string;
    };
  };
}

let generatedRuntimeSecret: string | null = null;

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const appUrl = process.env.APP_URL || `http://localhost:${port}`;

  // JWT Secret resolution:
  // In production, an explicit JWT_SECRET must be set. If not set, generate an ephemeral runtime secret
  // and warn loudly so tokens cannot be forged via known static keys.
  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      if (!generatedRuntimeSecret) {
        generatedRuntimeSecret = crypto.randomBytes(32).toString('hex');
        console.warn(
          '⚠️ [SECURITY WARNING] JWT_SECRET is not defined in production environment variables! ' +
          'Generated an ephemeral 256-bit runtime secret. Set JWT_SECRET in production to persist user sessions across server restarts.'
        );
      }
      jwtSecret = generatedRuntimeSecret;
    } else {
      jwtSecret = 'dev-insecure-secret-key-replace-in-production-2026';
    }
  }

  // Media provider detection
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) || Boolean(process.env.CLOUDINARY_URL);

  const hasS3 = Boolean(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  );

  let provider: 'cloudinary' | 's3' | 'local' = 'local';
  if (process.env.STORAGE_PROVIDER === 's3' && hasS3) {
    provider = 's3';
  } else if (hasCloudinary) {
    provider = 'cloudinary';
  } else if (hasS3) {
    provider = 's3';
  }

  return {
    port,
    nodeEnv,
    isProduction,
    appUrl,
    jwtSecret,
    mongoUri: process.env.MONGODB_URI?.trim(),
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD,
    media: {
      provider,
      cloudinary: hasCloudinary ? {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      } : undefined,
      s3: hasS3 ? {
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || 'us-east-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        endpoint: process.env.S3_ENDPOINT,
        publicDomain: process.env.S3_PUBLIC_DOMAIN,
      } : undefined,
    },
  };
}

export const config = loadConfig();
