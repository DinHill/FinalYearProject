const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image to Cloudinary
 * @param imageUri - Local URI of the image to upload
 * @param folder - Cloudinary folder to organize uploads (default: 'avatars')
 * @returns Upload result with Cloudinary URL
 */
export const uploadImageToCloudinary = async (
  imageUri: string,
  folder: string = 'avatars'
): Promise<CloudinaryUploadResult> => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary credentials not configured. Check your .env file.');
    }

    console.log('📤 Uploading image to Cloudinary...');

    // Create form data
    const formData = new FormData();

    // Extract filename and determine mime type
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append file as blob
    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    } as any);

    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    console.log('✅ Image uploaded successfully:', data.secure_url);

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
};

/**
 * Get an optimized image URL from Cloudinary public ID
 * @param publicId - Cloudinary public ID
 * @param width - Desired width (default: 400)
 * @param height - Desired height (default: 400)
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  publicId: string,
  width: number = 400,
  height: number = 400
): string => {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
};

/**
 * Get thumbnail URL from full Cloudinary URL
 * @param imageUrl - Full Cloudinary URL
 * @param size - Thumbnail size (default: 100)
 * @returns Thumbnail URL
 */
export const getThumbnailUrl = (imageUrl: string, size: number = 100): string => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  // Insert transformation parameters into URL
  const uploadIndex = imageUrl.indexOf('/upload/');
  if (uploadIndex === -1) return imageUrl;
  
  const transformation = `w_${size},h_${size},c_thumb,q_auto,f_auto`;
  return imageUrl.slice(0, uploadIndex + 8) + transformation + '/' + imageUrl.slice(uploadIndex + 8);
};
