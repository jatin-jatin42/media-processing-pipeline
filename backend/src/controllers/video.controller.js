import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import https from "https";

/**
 * Step 4: The Mock Analysis Logic
 * processVideoAnalysis(videoId, io)
 * 
 * - Updates status to 'processing'
 * - Waits 15 seconds (mocking AI heavy lifting)
 * - Randomly classifies as 'safe' (80%) or 'flagged' (20%)
 * - Emits real-time updates via Socket.io
 */
const processVideoAnalysis = async (videoId, io) => {
    try {
        const video = await Video.findById(videoId);
        if (!video) return;

        // 1. Set to 'processing'
        video.status = "processing";
        await video.save();
        
        if (io) {
            io.emit("videoStatusUpdate", {
                videoId,
                status: "processing",
                message: "Analyzing video content for sensitivity..."
            });
        }

        // 2. Mock delay of 15 seconds
        await new Promise((resolve) => setTimeout(resolve, 15000));

        // 3. Random Classification (80% safe, 20% flagged)
        const isSafe = Math.random() < 0.8;
        const finalStatus = isSafe ? "safe" : "flagged";
        const analysisNotes = isSafe 
            ? "Content analysis complete: No sensitive material detected." 
            : "Content analysis complete: Potential sensitive material detected.";

        video.status = finalStatus;
        video.analysisNotes = analysisNotes;
        await video.save();

        // 4. Final Socket Emit
        if (io) {
            io.emit("videoStatusUpdate", {
                videoId,
                status: finalStatus,
                message: analysisNotes
            });
        }
        
        console.log(`[Pipeline] Analysis complete for video ${videoId}: ${finalStatus}`);

    } catch (error) {
        console.error(`[Pipeline Error] Analysis failed for video ${videoId}:`, error.message);
    }
};

/**
 * Step 1: Enforce Tenant Isolation
 */
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId, status } = req.query;

    let sortCriteria = {};
    let videoQuery = {};

    // STRICT TENANT ISOLATION: Filter by organization
    videoQuery.tenantId = req.user.tenantId;

    // RBAC Isolation: Editors only see their own videos, Admins/Viewers see everything in the tenant
    if (req.user.role === "Editor") {
        videoQuery.owner = req.user._id;
    } else if (userId) {
        videoQuery.owner = userId;
    }

    if (status) {
        videoQuery.status = status;
    }

    if (query) {
        videoQuery.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    
    if (sortBy && sortType) {
        sortCriteria[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
        sortCriteria["createdAt"] = -1;
    }
    
    const videos = await Video.find(videoQuery)
        .sort(sortCriteria)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("owner", "username fullName avatar");
    
    const total = await Video.countDocuments(videoQuery);
    
    return res.status(200).json(new ApiResponse(200, {
        videos,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total
        }
    }, "Videos fetched successfully"));
});

/**
 * Step 2 & 3: Update Upload Controller & Asynchronous Invocation
 */
const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    const videoFile = req.files?.videoFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!title) throw new ApiError(400, "Title is required");
    if (!videoFile) throw new ApiError(400, "Video file is required");

    // 1. Cloudinary Upload
    const videoUploadResponse = await uploadOnCloudinary(videoFile.path, "video");
    if (!videoUploadResponse) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }

    const videoUrl = videoUploadResponse.secure_url || videoUploadResponse.url;
    if (!videoUrl) {
        throw new ApiError(500, "Cloudinary upload error: No URL returned.");
    }

    let thumbnailUrl = "";
    if (thumbnailFile) {
        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailFile.path, "image");
        if (thumbnailUploadResponse) {
            thumbnailUrl = thumbnailUploadResponse.secure_url || thumbnailUploadResponse.url;
        }
    }

    // 2. Save to DB with explicit Tenant/Owner mapping
    const video = await Video.create({
        title,
        description: description || "",
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        status: "pending",           // Initial status
        owner: req.user._id,         // uploadedBy
        tenantId: req.user.tenantId, // Organization isolation
        duration: videoUploadResponse.duration || 0,
        fileSize: videoFile.size,
        mimeType: videoFile.mimetype
    });

    // 3. Invoke Asynchronous Pipeline (Immediate return)
    // We do NOT await this. We pass the socket instance from req.app.
    const io = req.app.get("io");
    processVideoAnalysis(video._id, io);

    return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully. Analysis has started.")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, "Video ID is required");

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");
    if (!video) throw new ApiError(404, "Video not found");

    // Ensure user doesn't cross tenant boundaries
    if (video.tenantId !== req.user.tenantId) {
        throw new ApiError(403, "Access Denied: Resource belongs to another organization");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, status } = req.body;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    // Multi-Tenant Ownership Check
    if (video.owner.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
        throw new ApiError(403, "You do not have permission to update this video");
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (status) video.status = status;

    if (req.file) {
        const thumbnailUploadResponse = await uploadOnCloudinary(req.file.path, "image");
        if (thumbnailUploadResponse) {
            if (video.thumbnail) await deleteFromCloudinary(video.thumbnail);
            video.thumbnail = thumbnailUploadResponse.secure_url || thumbnailUploadResponse.url;
        }
    }

    await video.save();
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
        throw new ApiError(403, "You do not have permission to delete this video");
    }

    if (video.videoFile) await deleteFromCloudinary(video.videoFile);
    if (video.thumbnail) await deleteFromCloudinary(video.thumbnail);

    await Video.findByIdAndDelete(videoId);
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const streamVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video || !video.videoFile) throw new ApiError(404, "Video file not found");

    // Enforce tenant boundary for streaming
    if (video.tenantId !== req.user.tenantId) {
        throw new ApiError(403, "Access Denied");
    }

    const secureUrl = video.videoFile.replace("http://", "https://");
    const options = {
        headers: {
            ...(req.headers.range ? { Range: req.headers.range } : {})
        }
    };

    https.get(secureUrl, options, (cloudinaryRes) => {
        res.writeHead(cloudinaryRes.statusCode, cloudinaryRes.headers);
        cloudinaryRes.pipe(res);
    }).on('error', (err) => {
        res.status(500).json(new ApiError(500, "Error streaming video"));
    });
});

export { 
    getAllVideos, 
    uploadVideo, 
    getVideoById, 
    updateVideo, 
    deleteVideo,
    streamVideo
};