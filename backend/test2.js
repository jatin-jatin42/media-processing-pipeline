import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config(); // This will load .env from the current directory

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const testUpload = async () => {
    try {
        console.log("Keys loaded.");
        const response = await cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", {
            resource_type: "auto"
        });
        console.log("Upload success!", response.url);
    } catch (err) {
        console.error("Upload failed:", err);
    }
}
testUpload();
