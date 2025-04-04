import cloudinary from '../config/cloudinary';

export const uploadImage = async (imageUrl: string) => {
  try {
    // Upload the image from URL to Cloudinary
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'profile-photos',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

// export const deleteImage = async (publicId: string) => {
//   try {
//     await cloudinary.uploader.destroy(publicId);
//   } catch (error) {
//     console.error('Error deleting image from Cloudinary:', error);
//     throw error;
//   }
// };