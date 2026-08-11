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

/**
 * Exams are uploaded as `resource_type: 'raw'` with `type: 'private'` so the
 * file is never reachable by a guessable/public URL — every download must go
 * through `generateSignedExamFileUrl`, which is only called after the
 * requester already passed the exam-access authorization check.
 */
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
      resource_type: 'raw',
      type: 'private',
      folder: `${uploadFolder}/exams`,
      context: { original_filename: fileName },
    },
  );

  return {
    publicId: result.public_id,
    fileSize: result.bytes,
  };
}

/**
 * Cloudinary's `private_download_url` supports time-limited signatures but
 * always forces an `attachment` response, which breaks inline PDF viewing
 * (iframe on web, in-app browser on mobile). A plain signed delivery URL
 * (`type: 'private'`, `sign_url: true`) serves the PDF inline instead, so
 * both viewing and downloading use the same URL. The signature has no
 * expiry, but it's still never guessable and is only ever handed out after
 * the caller already passed the exam-access authorization check — it's
 * regenerated fresh on every `GET /exams/:id` rather than stored anywhere.
 */
export function generateSignedExamFileUrl(publicId: string): string {
  configureCloudinary();

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'private',
    sign_url: true,
    secure: true,
  });
}
