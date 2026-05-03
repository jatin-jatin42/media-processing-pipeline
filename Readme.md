# Streamit — Asynchronous Media Analysis Pipeline

Streamit is a robust, full-stack media platform designed to handle secure video delivery and automated content analysis. It features a non-blocking asynchronous pipeline that processes media in the background while keeping the user interface perfectly synced via real-time WebSockets.

---

## 🏗️ Architectural Overview

### 1. The Asynchronous Analysis Pipeline
To prevent long-running AI analysis from blocking the main thread or causing client timeouts, Streamit implements a **Producer-Consumer pattern** (simulated):
- **Immediate Response**: When a video is uploaded, the server returns a `201 Created` status instantly after the media is secured on Cloudinary.
- **Background Worker**: A background process (`processVideoAnalysis`) is triggered immediately.
- **State Machine**: The video transitions through `pending` → `processing` → `safe`/`flagged`.
- **Real-Time Feedback**: Every state transition is broadcast to the specific user via **Socket.io**, allowing the UI to reflect progress (spinners, status badges) live.

### 2. Multi-Tenant RBAC Implementation
Streamit enforces strict **Data Segregation** and **User Isolation**:
- **Tenant Isolation**: Every resource (User, Video) is tied to a `tenantId`. Users can only query or stream media belonging to their organization.
- **Owner Isolation**: Users with the `Editor` role are restricted to seeing and managing only the videos they personally uploaded.
- **Security Middleware**: Flagged content is blocked at the API level (Streaming & GetByID) and the UI level.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Optimized build times and modern component architecture. |
| **Styling** | Tailwind CSS | Rapid UI development with a focus on "Premium" aesthetics. |
| **Backend** | Node.js + Express | Highly scalable, non-blocking I/O ideal for media metadata handling. |
| **Database** | MongoDB + Mongoose | Schema flexibility for varying media metadata and easy indexing. |
| **Real-Time** | Socket.io | Reliable bi-directional communication with automatic reconnection. |
| **Storage** | Cloudinary | Enterprise-grade media storage with chunked upload support for large videos. |

---

## 🚀 Key Features & UI Enforcement

- **Live Dashboards**: Dynamic video library that updates status badges (🔵 Processing, ✅ Safe, 🚫 Flagged) in real-time.
- **Security Overlays**: Flagged videos are automatically covered with a "Security Block" overlay and playback links are disabled.
- **RBAC UI Constraints**:
  - **Viewer**: Read-only access; the "Upload" interface is completely hidden.
  - **Editor**: Full upload pipeline access with private library management.
  - **Admin**: Global organization visibility and system-wide management.
- **HTTP Range Requests**: Streamit supports partial content requests (206) for efficient video scrubbing and seek operations.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/users/register` | Register a new user (Viewer/Editor). |
| `POST` | `/api/v1/users/login` | Authenticate and receive JWT cookies. |
| `POST` | `/api/v1/users/logout` | Clear authentication cookies. |

### Video Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/videos` | All | Fetch library (Filtered by Role/Tenant). |
| `POST` | `/api/v1/videos` | Editor+ | Upload new media to the pipeline. |
| `GET` | `/api/v1/videos/:id` | All | Fetch metadata for a specific video. |
| `PATCH` | `/api/v1/videos/:id` | Owner+ | Update video title/description/thumbnail. |
| `DELETE` | `/api/v1/videos/:id` | Owner+ | Permanently remove media from Cloudinary/DB. |
| `GET` | `/api/v1/videos/stream/:id` | All | Proxy stream with HTTP Range Request support. |

---

## 📂 Project Structure

```text
├── backend
│   ├── src
│   │   ├── controllers     # Business logic (Upload, Auth, Analysis)
│   │   ├── models          # Mongoose Schemas (User, Video)
│   │   ├── middlewares     # RBAC, Auth, & Multer
│   │   ├── routes          # API Endpoints
│   │   └── utils           # Cloudinary & Global Error Handlers
│   ├── seedDemo.js         # Multi-tenant seeding script
│   └── clearDb.js          # Database reset utility
├── frontend
│   ├── src
│   │   ├── components      # Reusable UI (Modals, Navbar)
│   │   ├── context         # Auth State Management
│   │   ├── pages           # Dashboard, Login, Registration
│   │   └── socket.js       # WebSocket Singleton
```

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites
- Node.js (LTS version)
- MongoDB Atlas Account
- Cloudinary Account (Free tier is sufficient)

### 2. Backend Installation
```bash
cd backend
npm install

# Configuration
# Copy .env.sample to .env and fill in your Cloudinary and MongoDB keys
cp .env.sample .env

# Initialize Database
# This clears old data and creates the RBAC demo accounts
node seedDemo.js

# Start Development Server
npm run dev
```

### 3. Frontend Installation
```bash
cd frontend
npm install

# Configuration
# Copy .env.sample to .env
cp .env.sample .env

# Start Development Server
npm run dev
```

---

## 🔐 Testing Credentials (RBAC Matrix)

Reviewers can use these pre-seeded accounts to verify the multi-tenant and role-based constraints:

| Organization | Role | Email | Password | UI Access |
| :--- | :--- | :--- | :--- | :--- |
| **Streamit Org** | Editor | `editor@streamit.com` | `Editor@1234` | Only own uploads |
| **Streamit Org** | Viewer | `viewer@streamit.com` | `Viewer@1234` | Read-only (No Upload) |
| **Other Org** | Editor | `other@demo.com` | `Other@1234` | Isolated from Streamit Org |

---
*This project was developed as a technical demonstration of scalable media processing pipelines, focusing on security, real-time feedback, and architectural integrity.*
