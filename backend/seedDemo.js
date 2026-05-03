/**
 * Demo Seed Script
 * 
 * Creates all 3 demo accounts (Admin, Editor, Viewer) for testing.
 * Safe to run multiple times — skips existing accounts.
 * 
 * Usage:
 *   cd backend
 *   node seedDemo.js
 */

import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import connectDB from "./src/db/index.js";

dotenv.config();

const DEMO_USERS = [
    {
        username: "admin",
        email: "admin@mediapipeline.com",
        password: "Admin@1234",
        fullName: "Platform Admin",
        role: "Admin"
    },
    {
        username: "editor_demo",
        email: "editor@demo.com",
        password: "Editor@1234",
        fullName: "Demo Editor",
        role: "Editor"
    },
    {
        username: "viewer_demo",
        email: "viewer@demo.com",
        password: "Viewer@1234",
        fullName: "Demo Viewer",
        role: "Viewer"
    }
];

const seedDemo = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        await connectDB();
        
        console.log("🌱 Seeding demo accounts...\n");

        for (const userData of DEMO_USERS) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                console.log(`⏭️  Skipped   : ${userData.role} (${userData.email}) — already exists`);
            } else {
                await User.create(userData);
                console.log(`✅ Created   : ${userData.role} (${userData.email})`);
            }
        }

        console.log("\n──────────────────────────────────────────────────");
        console.log("  Demo Credentials (for testing):");
        console.log("──────────────────────────────────────────────────");
        DEMO_USERS.forEach(u => {
            console.log(`  ${u.role.padEnd(8)}: ${u.email.padEnd(32)} / ${u.password}`);
        });
        console.log("──────────────────────────────────────────────────");
        console.log("⚠️  Change these passwords before deploying to production!\n");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedDemo();
