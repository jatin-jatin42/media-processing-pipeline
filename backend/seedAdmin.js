/**
 * Admin Seeder Script
 * 
 * Creates the default platform Admin account.
 * Run this ONCE after setting up the database.
 * 
 * Usage:
 *   cd backend
 *   node seedAdmin.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import connectDB from "./src/db/index.js";

dotenv.config();

const ADMIN_CREDENTIALS = {
    username: "admin",
    email: "admin@streamit.com",
    password: "Admin@1234",
    fullName: "Platform Admin",
    role: "Admin"
};

const seedAdmin = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        await connectDB();

        const existing = await User.findOne({ email: ADMIN_CREDENTIALS.email });
        if (existing) {
            console.log("✅ Admin account already exists. No changes made.");
            process.exit(0);
        }

        await User.create(ADMIN_CREDENTIALS);
        
        console.log("✅ Admin account created successfully!");
        console.log("──────────────────────────────────────");
        console.log(`   Email   : ${ADMIN_CREDENTIALS.email}`);
        console.log(`   Password: ${ADMIN_CREDENTIALS.password}`);
        console.log("──────────────────────────────────────");
        console.log("⚠️  Change this password in production!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to seed admin:", error.message);
        process.exit(1);
    }
};

seedAdmin();
