# Deployment Guide (Render + Vercel)

The repository is fully configured for a production deployment. Follow these exact steps to deploy the backend to Render and the frontend to Vercel.

## 1. Deploy the Backend (Render)
Render natively supports Node.js applications and handles WebSockets seamlessly.

1. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the Web Service:
   * **Name**: `media-pipeline-backend` (or similar)
   * **Root Directory**: `backend` *(Crucial: Make sure to type 'backend' here)*
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   * `PORT`: `8000`
   * `MONGODB_URI`: Your MongoDB Atlas connection string.
   * `CORS_ORIGIN`: Wait to set this until you have your Vercel URL (e.g., `https://your-vercel-app.vercel.app`).
   * `ACCESS_TOKEN_SECRET`: A long random string (e.g., `generate_with_openssl_rand_hex_32`).
   * `ACCESS_TOKEN_EXPIRY`: `1d`
   * `CLOUDINARY_CLOUD_NAME`: From Cloudinary dashboard.
   * `CLOUDINARY_API_KEY`: From Cloudinary dashboard.
   * `CLOUDINARY_API_SECRET`: From Cloudinary dashboard.
5. Click **Create Web Service**. Wait for it to build and copy the deployment URL (e.g., `https://media-pipeline-backend.onrender.com`).

---

## 2. Deploy the Frontend (Vercel)
Vercel is optimized for Vite + React applications.

1. Go to your [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
2. Import this GitHub repository.
3. In the "Configure Project" screen, edit the **Root Directory** and set it to `frontend`.
4. The Build Settings will automatically detect Vite:
   * Framework Preset: `Vite`
   * Build Command: `npm run build`
   * Output Directory: `dist`
5. Expand **Environment Variables** and add:
   * `VITE_API_URL`: `https://YOUR-RENDER-URL.onrender.com/api/v1` *(Replace with your actual Render URL from step 1)*
   * `VITE_SOCKET_URL`: `https://YOUR-RENDER-URL.onrender.com`
6. Click **Deploy**.

*(Note: We have already added `frontend/vercel.json` to handle React Router navigation automatically).*

---

## 3. Final Connection
Now that your Vercel frontend is deployed:
1. Copy the public URL of your Vercel app.
2. Go back to your Render Dashboard for your backend service.
3. Update the `CORS_ORIGIN` environment variable with your Vercel URL (make sure there is no trailing slash, e.g., `https://my-app.vercel.app`).
4. Render will automatically restart. Your full stack is now live and talking to each other securely!
