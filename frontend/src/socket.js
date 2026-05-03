import { io } from "socket.io-client";

/**
 * Socket.io client singleton.
 * Connected to the backend Socket.io server.
 * Import this wherever you need real-time pipeline status updates.
 *
 * Usage:
 *   import socket from "@/socket";
 *   socket.on("processingProgress", ({ videoId, progress }) => { ... });
 */
const socket = io(
  import.meta.env.VITE_SOCKET_URL || "http://localhost:8000",
  {
    withCredentials: true,
    autoConnect: true,
  }
);

socket.on("connect", () => {
  console.log("[Socket.io] Connected — id:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[Socket.io] Disconnected:", reason);
});

export default socket;
