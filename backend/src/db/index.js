import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
        );
        console.log(
            `[DB] MongoDB connected — host: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error("[DB] MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;
