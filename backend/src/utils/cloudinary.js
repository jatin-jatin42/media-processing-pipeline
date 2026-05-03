import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
  try {
    if (!localFilePath) return null;
    console.log("Uploading to Cloudinary from:", localFilePath, "Type:", resourceType);
    
    let response;
    if (resourceType === "video") {
        response = await cloudinary.uploader.upload_large(localFilePath, {
            resource_type: "video",
            chunk_size: 6000000 // 6MB chunks
        });
    } else {
        response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType
        });
    }
    // File has been uploaded successfully
    console.log("Cloudinary upload successful:", response.url);
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) {
      console.error("Failed to delete local file:", e);
    }
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
      }
    } catch (e) {
      console.error("Failed to delete local file in catch block:", e);
    }
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
