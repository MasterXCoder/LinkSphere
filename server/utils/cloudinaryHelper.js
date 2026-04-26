const cloudinary = require("cloudinary").v2;

/**
 * Extracts the public_id from a Cloudinary URL.
 * Example: "https://res.cloudinary.com/demo/image/upload/v12345/folder/image.jpg" 
 * returns "folder/image"
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  
  // Split by / to get the parts
  const parts = url.split("/");
  
  // Find the index of 'upload'
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;
  
  // The public_id starts after the version (v12345) part
  // We take all parts after the version and join them back
  const publicIdWithExtension = parts.slice(uploadIndex + 2).join("/");
  
  // Remove the file extension (.jpg, .png, etc)
  return publicIdWithExtension.split(".")[0];
};

/**
 * Deletes an image from Cloudinary if the URL is valid
 */
const deleteImage = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (err) {
      console.error("Cloudinary deletion error:", err);
      return false;
    }
  }
  return false;
};

module.exports = {
  getPublicIdFromUrl,
  deleteImage,
};
