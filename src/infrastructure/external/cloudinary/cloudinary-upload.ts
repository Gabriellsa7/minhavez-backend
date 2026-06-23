import crypto from 'crypto';

interface IUploadImageParams {
  imageBase64: string;
  fileName?: string;
  mimeType?: string;
}

interface ICloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  asset_id?: string;
}

export async function uploadImageToCloudinary({
  imageBase64,
  fileName = 'upload.jpg',
  mimeType = 'image/jpeg',
}: IUploadImageParams): Promise<{
  secureUrl: string;
  publicId?: string;
}> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'minha-vez-app';

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signatureBase = `folder=${uploadFolder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto
    .createHash('sha1')
    .update(signatureBase)
    .digest('hex');

  const cleanBase64 = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const formData = new FormData();
  formData.append('file', new Blob([Buffer.from(cleanBase64, 'base64')], { type: mimeType }), fileName);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', uploadFolder);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const data = (await response.json()) as ICloudinaryUploadResponse;

  if (!data.secure_url) {
    throw new Error('Cloudinary did not return a secure URL');
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
  };
}
