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
    if (file.fieldname === "videoFile" && file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else if (file.fieldname === "thumbnail" && file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
        // Fallback for general usage if needed
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only videos and images are allowed."), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});