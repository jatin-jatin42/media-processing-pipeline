import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/uploads");
    },
    filename: function (req, file, cb) {
        // Unique filename: timestamp + random suffix + original extension
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (file.fieldname === "videoFile") {
        if (allowedVideoTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid video format. Supported: MP4, WebM, MOV, MKV."), false);
        }
    } else if (file.fieldname === "thumbnail") {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid image format. Supported: JPG, PNG, WebP."), false);
        }
    } else {
        cb(new Error("Unexpected field name."), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});