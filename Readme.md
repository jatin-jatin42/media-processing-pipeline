# Media Analysis Pipeline

A comprehensive full-stack application that enables users to upload videos, processes them for content sensitivity analysis, and provides seamless video streaming capabilities with real-time progress tracking.

## 🚀 Project Overview

This project is built as an enterprise-grade asynchronous media processing system. It uses a Node.js + Express backend with Socket.io for real-time updates, and a React + Vite frontend for a responsive user experience.

### Key Features
- **Video Management**: Secure upload and storage system.
- **Content Analysis**: Automated sensitivity detection (safe/flagged classification).
- **Real-Time Updates**: Live processing progress tracking via Socket.io.
- **Streaming Service**: Video playback using HTTP range requests.
- **Access Control**: Role-Based Access Control (Viewer, Editor, Admin).

## 📁 Project Structure

```
.
├── backend/          # Node.js + Express API
│   ├── src/          # Source code
│   └── public/       # Local file storage (uploads)
├── frontend/         # React + Vite application
│   └── src/          # UI components & logic
└── requirements.txt  # Project specifications
```

## 🛠️ Installation & Setup

### 1. Prerequisites
- Node.js (Latest LTS)
- MongoDB Atlas account or local MongoDB instance

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.sample` to `.env` and fill in your MongoDB URI and JWT secrets.
4. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.sample` to `.env`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Login and receive tokens
- `POST /api/v1/users/logout` - Logout and clear tokens

### Video Operations
- `GET /api/v1/videos` - List all videos
- `POST /api/v1/videos` - Upload a new video (Editor/Admin only)
- `GET /api/v1/videos/:videoId` - Get video details and stream
- `PATCH /api/v1/videos/:videoId` - Update video metadata
- `DELETE /api/v1/videos/:videoId` - Remove a video

## 🛡️ Role-Based Access Control (RBAC)
- **Viewer**: Read-only access to videos.
- **Editor**: Upload, edit, and manage video content.
- **Admin**: Full system access.

## 📝 License
ISC
