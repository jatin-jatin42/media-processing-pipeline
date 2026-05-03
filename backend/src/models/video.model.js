import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        // Local path or cloud URL of the stored video file
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            default: ""
        },
        // Pipeline processing state
        status: {
            type: String,
            enum: ["pending", "processing", "safe", "flagged"],
            default: "pending"
        },
        // Metadata extracted by FFmpeg during processing
        duration: {
            type: Number,   // seconds
            default: 0
        },
        resolution: {
            width:  { type: Number, default: 0 },
            height: { type: Number, default: 0 }
        },
        mimeType: {
            type: String,
            default: ""
        },
        fileSize: {
            type: Number,   // bytes
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        // Notes populated by the sensitivity analysis step
        analysisNotes: {
            type: String,
            default: ""
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // Multi-Tenancy: grouping videos by organization/group
        tenantId: {
            type: String,
            required: true,
            default: "default-tenant",
            index: true
        }
    },
    { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema);
