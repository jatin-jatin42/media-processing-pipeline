import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { processVideoBackground } from "../utils/videoProcessor.js";
import https from "https";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId, status } = req.query;

    let sortCriteria = {};
    let videoQuery = {};

    if (userId) {
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

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    const videoFile = req.files?.videoFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!title) {
        throw new ApiError(400, "Title is required");
    }
    
    if (!videoFile) {
        throw new ApiError(400, "Video file is required");
    }

    const videoUploadResponse = await uploadOnCloudinary(videoFile.path, "video");
    if (!videoUploadResponse) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }

    let thumbnailUrl = "";
    if (thumbnailFile) {
        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailFile.path, "image");
        if (thumbnailUploadResponse) {
            thumbnailUrl = thumbnailUploadResponse.url;
        }
    }

    console.log("Cloudinary Video Response:", videoUploadResponse);

    const videoUrl = videoUploadResponse.secure_url || videoUploadResponse.url;

    if (!videoUrl) {
        throw new ApiError(500, "Cloudinary upload succeeded but no URL was returned. Check backend logs.");
    }

    const video = await Video.create({
        title,
        description: description || "",
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        status: "pending",
        owner: req.user._id,
        duration: videoUploadResponse.duration || 0,
        fileSize: videoFile.size,
        mimeType: videoFile.mimetype
    });

    // Trigger background processing asynchronously (do not await)
    processVideoBackground(video._id);

    return res.status(201).json(new ApiResponse(201, video, "Video uploaded and queued for processing"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, status } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
        throw new ApiError(403, "You do not have permission to update this video");
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (status && ["pending", "processing", "safe", "flagged"].includes(status)) {
        video.status = status;
    }

    if (req.file) {
        const thumbnailUploadResponse = await uploadOnCloudinary(req.file.path, "image");
        if (thumbnailUploadResponse) {
            if (video.thumbnail) {
                await deleteFromCloudinary(video.thumbnail);
            }
            video.thumbnail = thumbnailUploadResponse.secure_url || thumbnailUploadResponse.url;
        }
    }

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
        throw new ApiError(403, "You do not have permission to delete this video");
    }

    // Delete files from Cloudinary
    if (video.videoFile) await deleteFromCloudinary(video.videoFile);
    if (video.thumbnail) await deleteFromCloudinary(video.thumbnail);

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const streamVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.videoFile) {
        throw new ApiError(404, "Video file not available for streaming");
    }

    // Use the Cloudinary URL. Ensure it's HTTPS.
    const secureUrl = video.videoFile.replace("http://", "https://");

    // Forward the Range header to Cloudinary so it can respond with 206 Partial Content
    const options = {
        headers: {
            ...(req.headers.range ? { Range: req.headers.range } : {})
        }
    };

    https.get(secureUrl, options, (cloudinaryRes) => {
        // Forward the headers and status code back to the client
        res.writeHead(cloudinaryRes.statusCode, cloudinaryRes.headers);
        cloudinaryRes.pipe(res);
    }).on('error', (err) => {
        console.error("Stream proxy error:", err);
        if (!res.headersSent) {
            res.status(500).json(new ApiError(500, "Error streaming video from source"));
        }
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