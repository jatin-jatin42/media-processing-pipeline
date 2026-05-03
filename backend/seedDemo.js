/**
 * Multi-Tenant Demo Seed Script
 * 
 * Creates accounts across different tenants to demonstrate:
 * 1. User Isolation (Editors see only their own)
 * 2. Tenant Segregation (Users from different orgs don't see each other)
 * 3. RBAC (Admin/Editor/Viewer permissions)
 * 
 * Usage:
 *   cd backend
 *   node seedDemo.js
 */

import "dotenv/config";
import { User } from "./src/models/user.model.js";
import { Video } from "./src/models/video.model.js";
import connectDB from "./src/db/index.js";

const DEMO_USERS = [
    // TENANT: Streamit Org
    {
        username: "admin",
        email: "admin@streamit.com",
        password: "Admin@1234",
        fullName: "Platform Admin",
        role: "Admin",
        tenantId: "streamit-org"
    },
    {
        username: "editor_demo",
        email: "editor@streamit.com",
        password: "Editor@1234",
        fullName: "Streamit Editor",
        role: "Editor",
        tenantId: "streamit-org"
    },
    {
        username: "viewer_demo",
        email: "viewer@streamit.com",
        password: "Viewer@1234",
        fullName: "Streamit Viewer",
        role: "Viewer",
        tenantId: "streamit-org"
    },
    // TENANT: Independent Group (Isolation Test)
    {
        username: "other_editor",
        email: "other@demo.com",
        password: "Other@1234",
        fullName: "External Editor",
        role: "Editor",
        tenantId: "other-org"
    }
];

const seedDemo = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        await connectDB();
        
        console.log("🧹 Clearing existing data for clean demo...");
        await User.deleteMany({});
        await Video.deleteMany({});

        console.log("🌱 Seeding Multi-Tenant demo accounts...\n");

        for (const userData of DEMO_USERS) {
            await User.create(userData);
            console.log(`✅ Created   : [${userData.tenantId}] ${userData.role} — ${userData.email}`);
        }

        console.log("\n──────────────────────────────────────────────────");
        console.log("  Demo Credentials (Multi-Tenant):");
        console.log("──────────────────────────────────────────────────");
        DEMO_USERS.forEach(u => {
            console.log(`  [${u.tenantId.padEnd(12)}] ${u.role.padEnd(7)}: ${u.email.padEnd(25)} / ${u.password}`);
        });
        console.log("──────────────────────────────────────────────────");
        console.log("🚀 Multi-Tenant Architecture implementation complete!\n");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedDemo();
