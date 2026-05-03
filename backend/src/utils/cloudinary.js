import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify keys are loaded
if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn("⚠️  Cloudinary configuration missing. Check your .env file.");
}

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
  try {
    if (!localFilePath) return null;
    
    // Explicitly pass credentials to avoid internal SDK config loss during streaming
    const options = {
        resource_type: resourceType,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    };

    console.log("Uploading to Cloudinary:", localFilePath, "Type:", resourceType);
    
    let response;
    if (resourceType === "video") {
        // upload_large returns a 'Chunkable' stream object. 
        // We MUST use a callback to reliably capture the final result as a Promise.
        response = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(localFilePath, {
                ...options,
                chunk_size: 6000000, // 6MB chunks
            }, (error, result) => {
                if (error) {
                    console.error("Cloudinary Chunkable Error:", error);
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    } else {
        response = await cloudinary.uploader.upload(localFilePath, options);
    }

    if (response) {
        console.log("Cloudinary upload successful:", response.secure_url || response.url);
    }

    try {
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    return response;
  } catch (error) {
    console.error("Final Cloudinary error catch:", error);
    try {
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    } catch (e) {}
    return null;
  }
};

const deleteFromCloudinary = async (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl) return null;
    // Extract public_id from url
    const publicId = cloudinaryUrl.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
