import axios from "axios";

/**
 * Pre-configured Axios instance — all requests automatically go to /api/v1/*
 * The Vite proxy forwards /api → http://localhost:8000 in development.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true, // send cookies (JWT refresh token)
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token from localStorage to every request (if present)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
