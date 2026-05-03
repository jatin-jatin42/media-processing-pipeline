import mongoose from "mongoose"
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import { Video } from "./src/models/video.model.js";
import connectDB from "./src/db/index.js";

// Load env variables
dotenv.config();

const clearDatabase = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        await connectDB();

        console.log("🧹 Clearing all User records...");
        await User.deleteMany({});
        
        console.log("🧹 Clearing all Video records...");
        await Video.deleteMany({});
        
        console.log("✅ Database cleared successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to clear database:", error);
        process.exit(1);
    }
};

clearDatabase();
