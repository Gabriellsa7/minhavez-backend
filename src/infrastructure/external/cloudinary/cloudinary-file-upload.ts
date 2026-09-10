import { v2 as cloudinary } from 'cloudinary';

interface IUploadPdfParams {
  fileBase64: string;
  fileName: string;
}

interface IUploadPdfResult {
  publicId: string;
  fileSize?: number;
}

interface ICloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

function configureCloudinary(): ICloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not configured');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return { cloudName, apiKey, apiSecret };
}

export async function uploadPdfToCloudinary({
  fileBase64,
  fileName,
}: IUploadPdfParams): Promise<IUploadPdfResult> {
  configureCloudinary();

  const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'minha-vez-app';
  const cleanBase64 = fileBase64.includes(',')
    ? fileBase64.split(',')[1]
    : fileBase64;

  const result = await cloudinary.uploader.upload(
    `data:application/pdf;base64,${cleanBase64}`,
    {
      resource_type: 'image',
      type: 'authenticated',
      folder: `${uploadFolder}/exams`,
      format: 'pdf',
      context: { original_filename: fileName },
    },
  );

  return {
    publicId: result.public_id,
    fileSize: result.bytes,
  };
}

export function generateSignedExamFileUrl(
  publicId: string,
  expiresInSeconds = 10 * 60,
): string {
  configureCloudinary();

  return cloudinary.utils.private_download_url(publicId, 'pdf', {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

interface IUploadPatientDocumentParams {
  fileBase64: string;
  fileName: string;
  format: string;
  mimeType: string;
}

interface IUploadPatientDocumentResult {
  publicId: string;
  fileSize?: number;
}

export async function uploadPatientDocumentToCloudinary({
  fileBase64,
  fileName,
  format,
  mimeType,
}: IUploadPatientDocumentParams): Promise<IUploadPatientDocumentResult> {
  configureCloudinary();

  const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'minha-vez-app';
  const cleanBase64 = fileBase64.includes(',')
    ? fileBase64.split(',')[1]
    : fileBase64;

  const result = await cloudinary.uploader.upload(
    `data:${mimeType};base64,${cleanBase64}`,
    {
      resource_type: 'image',
      type: 'authenticated',
      folder: `${uploadFolder}/patient-documents`,
      format,
      context: { original_filename: fileName },
    },
  );

  return {
    publicId: result.public_id,
    fileSize: result.bytes,
  };
}

export function generateSignedPatientDocumentUrl(
  publicId: string,
  format: string,
  expiresInSeconds = 10 * 60,
): string {
  configureCloudinary();

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}
