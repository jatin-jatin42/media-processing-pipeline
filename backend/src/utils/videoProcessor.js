import { Video } from "../models/video.model.js";
import { io } from "../index.js";

/**
 * Simulates a video processing and sensitivity analysis pipeline.
 * In a production environment, this would be an FFmpeg child process
 * or a job queued in Redis (e.g., BullMQ) running ML models.
 */
export const processVideoBackground = async (videoId) => {
    try {
        const video = await Video.findById(videoId);
        if (!video) return;

        // 1. Mark as processing
        video.status = "processing";
        await video.save();
        
        // Emit initial status
        io.emit("processingUpdate", {
            videoId: video._id,
            status: "processing",
            progress: 0,
            message: "Starting sensitivity analysis..."
        });

        // 2. Simulate processing steps (0 to 100%)
        let progress = 0;
        const processInterval = setInterval(async () => {
            progress += 20; // Increment by 20%
            
            if (progress <= 100) {
                io.emit("processingUpdate", {
                    videoId: video._id,
                    status: "processing",
                    progress: progress,
                    message: `Analyzing content... ${progress}%`
                });
            }

            if (progress >= 100) {
                clearInterval(processInterval);
                
                // 3. Determine final safety status (Simulated ML logic)
                // 90% chance of being safe, 10% chance of being flagged
                const isSafe = Math.random() > 0.1;
                const finalStatus = isSafe ? "safe" : "flagged";
                const analysisNotes = isSafe 
                    ? "Content analyzed: No sensitive or restricted material detected." 
                    : "Content flagged: Automated analysis detected potentially sensitive material.";

                // Update DB
                video.status = finalStatus;
                video.analysisNotes = analysisNotes;
                await video.save();

                // Emit completion
                io.emit("processingUpdate", {
                    videoId: video._id,
                    status: finalStatus,
                    progress: 100,
                    message: analysisNotes
                });
            }
        }, 3000); // Update every 3 seconds

    } catch (error) {
        console.error("Video processing failed:", error);
        
        // Emit failure
        io.emit("processingUpdate", {
            videoId: videoId,
            status: "flagged", // Fail safe
            progress: 0,
            message: "Processing pipeline failed due to an internal error."
        });
        
        // Update DB
        await Video.findByIdAndUpdate(videoId, {
            status: "flagged",
            analysisNotes: "Processing pipeline failed."
        });
    }
};
