import "dotenv/config";
import connectDB from "./db/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

// Create HTTP server to share with Socket.io
const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        credentials: true,
    },
});

io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected — id: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`[Socket.io] Client disconnected — id: ${socket.id}`);
    });
});

connectDB()
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(
                `[Server] Media Analysis Pipeline API running on port ${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error("[Server] Startup failed:", error.message);
        process.exit(1);
    });
